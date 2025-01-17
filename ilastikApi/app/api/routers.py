import asyncio
import os
from ilastik.shell.projectManager import ProjectManager
from ilastik.shell.headless.headlessShell import HeadlessShell
from ilastik.workflows.pixelClassification import PixelClassificationWorkflow
from ilastik.utility.slicingtools import sl, slicing2shape
from fastapi.responses import JSONResponse, FileResponse
from ilastikApi.config import STATIC_PATH, CURRENT_STATIC
from fastapi import (
    Request,
    Body,
    APIRouter,
    Depends,
    status,
    UploadFile,
    File,
    Form,
    HTTPException,
    Response
)
import tempfile
import numpy
import sys
import ilastik.__main__
import json
from more_itertools import consecutive_groups
from typing import List
from lazyflow.graph import Graph
from lazyflow.operators.ioOperators import OpInputDataReader
from lazyflow.roi import roiToSlice, roiFromShape
import aiofiles
from PIL import Image
import cv2
import subprocess

ilastik_startup = ilastik.__main__

router = APIRouter(
    prefix="/image",
    tags=["image"],
)

@router.get(
    "/test_create_project",
    response_description="Test for creating ilastik project",
)
async def testCreateProject():
    projectPath = os.path.join(STATIC_PATH, 'test_ilastik_projects')
    if not os.path.exists(projectPath):
        os.makedirs(projectPath)

    project_file_path = os.path.join(projectPath, 'TestProject.ilp')

    newProjectFile = ProjectManager.createBlankProjectFile(project_file_path, PixelClassificationWorkflow, [])
    newProjectFile.close()

    return JSONResponse({"success": True})

@router.get(
    "/test_process",
    response_description="Test for creating ilastik project",
)
async def testProcess():
    projectPath = os.path.join(STATIC_PATH, 'test_ilastik_projects')
    if not os.path.exists(projectPath):
        os.makedirs(projectPath)

    project_file_path = os.path.join(projectPath, 'TestProcess.ilp')
    shell = HeadlessShell()

    sampleData = "/app/shared_static/at3.ome.tiff"
    sampleMask = "/app/shared_static/at3_mask.jpg"

    newProjectFile = ProjectManager.createBlankProjectFile(project_file_path, PixelClassificationWorkflow, [])
    newProjectFile.close()

    shell.openProjectFile(project_file_path)
    workflow = shell.workflow

    # Add a file
    from ilastik.applets.dataSelection.opDataSelection import FilesystemDatasetInfo

    info = FilesystemDatasetInfo(filePath=sampleData)
    opDataSelection = workflow.dataSelectionApplet.topLevelOperator
    opDataSelection.DatasetGroup.resize(1)
    opDataSelection.DatasetGroup[0][0].setValue(info)

    # Set some features
    ScalesList = [0.3, 0.7, 1, 1.6, 3.5, 5.0, 10.0]
    FeatureIds = [
        "GaussianSmoothing",
        "LaplacianOfGaussian",
        "StructureTensorEigenvalues",
        "HessianOfGaussianEigenvalues",
        "GaussianGradientMagnitude",
        "DifferenceOfGaussians",
    ]

    opFeatures = workflow.featureSelectionApplet.topLevelOperator
    opFeatures.Scales.setValue(ScalesList)
    opFeatures.FeatureIds.setValue(FeatureIds)

    #                    sigma:   0.3    0.7    1.0    1.6    3.5    5.0   10.0
    selections = numpy.array(
        [
            [True, False, False, False, False, False, False],
            [True, False, False, False, False, False, False],
            [True, False, False, False, False, False, False],
            [False, False, False, False, False, False, False],
            [False, False, False, False, False, False, False],
            [False, False, False, False, False, False, False],
        ]
    )
    opFeatures.SelectionMatrix.setValue(selections)

    # Add some labels directly to the operator
    opPixelClass = workflow.pcApplet.topLevelOperator

    label_data_paths = ['/app/shared_static/Labels.jpg']
    # Read each label volume and inject the label data into the appropriate training slot
    cwd = os.getcwd()
    label_classes = set()
    for lane, label_data_path in enumerate(label_data_paths):
        graph = Graph()
        opReader = OpInputDataReader(graph=graph)
        try:
            opReader.WorkingDirectory.setValue(cwd)
            opReader.FilePath.setValue(label_data_path)

            print("Reading label volume: {}".format(label_data_path))
            label_volume = opReader.Output[:].wait()
        finally:
            opReader.cleanUp()

        raw_shape = opPixelClass.InputImages[lane].meta.shape
        if label_volume.ndim != len(raw_shape):
            # Append a singleton channel axis
            assert label_volume.ndim == len(raw_shape) - 1
            label_volume = label_volume[..., None]

        # Auto-calculate the max label value
        label_classes.update(numpy.unique(label_volume))

        print("Applying label volume to lane #{}".format(lane))
        entire_volume_slicing = roiToSlice(*roiFromShape(label_volume.shape))
        opPixelClass.LabelInputs[lane][entire_volume_slicing] = label_volume

    assert len(label_classes) > 1, "Not enough label classes were found in your label data."
    label_names = [str(label_class) for label_class in sorted(label_classes) if label_class != 0]
    opPixelClass.LabelNames.setValue(label_names)

    # Train the classifier
    opPixelClass.FreezePredictions.setValue(False)
    _ = opPixelClass.Classifier.value

    # Save and close
    shell.projectManager.saveProject()
    shell.closeCurrentProject()
    del shell

    # NOTE: In this test, cmd-line args to tests will also end up getting "parsed" by ilastik.
    #       That shouldn't be an issue, since the pixel classification workflow ignores unrecognized options.
    #       See if __name__ == __main__ section, below.
    args = "--project=" + project_file_path
    args += " --headless"

    # args += " --sys_tmp_dir=/tmp"

    # Batch export options
    args += " --output_format=tiff"
    args += " --output_filename_format={dataset_dir}/{nickname}_prediction.tiff"
    args += " --output_internal_path=volume/pred_volume"
    args += " --raw_data"
    # test that relative path works correctly: should be relative to cwd, not project file.
    args += " " + os.path.normpath(os.path.relpath(sampleData, os.getcwd()))
    args += " --prediction_mask"
    args += " " + sampleMask

    old_sys_argv = list(sys.argv)
    sys.argv = ["ilastik.py"]  # Clear the existing commandline args so it looks like we're starting fresh.
    sys.argv += args.split()

    # Start up the ilastik.py entry script as if we had launched it from the command line
    try:
        ilastik_startup.main()
    finally:
        sys.argv = old_sys_argv

    return JSONResponse({"success": True})

@router.post(
    "/test_label",
    response_description="Test Draw for label",
)
async def testLabel(request: Request):
    data = await request.form()
    imagePath = data.get("original_image_url")
    labelPath = os.path.join(STATIC_PATH, 'labels')
    labelPath = labelPath + tempfile.mkdtemp()

    if not os.path.exists(labelPath):
        os.makedirs(labelPath)

    labelList = data.get("label_list")
    labelList = json.loads(labelList)

    img = cv2.imread(imagePath)
    height = img.shape[0]
    width = img.shape[1]
    print("image-size: ", width, " : ", height)

    labelImagePath = labelPath + "/Labels.png"
    cv2.imwrite(labelImagePath, numpy.zeros((height, width, 3), numpy.uint8))
    blank_image = cv2.imread(labelImagePath)

    for label in labelList:
        labelPositionArr = label["positions"]
        h = label["label_color"].lstrip('#')

        if len(labelPositionArr) > 0:
            for arr in labelPositionArr:
                coordinates = []
                for pos in arr:
                    coordinates.append((pos["x"], pos["y"]))

                pts = numpy.array(coordinates, numpy.int32)
                pts = pts.reshape((-1, 1, 2))
                color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

                thickness = 8
                isClosed = False

                blank_image = cv2.polylines(blank_image, [pts],
                                      isClosed, color,
                                      thickness)

    blank_image = cv2.cvtColor(blank_image, cv2.COLOR_BGR2GRAY)

    cv2.imwrite(labelImagePath, blank_image)

    return JSONResponse({"success": True, "image_path": labelImagePath})

@router.post(
    "/process_image",
    response_description="Process image",
)
async def processImage(request: Request):
    data = await request.form()
    imagePath = data.get("original_image_url")
    thickness = int(data.get("thickness"))
    dataImagePath = os.path.join("/app/shared_static", 'processed_images', tempfile.mkdtemp())
    projectPath = os.path.join(STATIC_PATH, 'ilastik_projects')
    labelPath = os.path.join(STATIC_PATH, 'labels')
    projectPath = projectPath + tempfile.mkdtemp()
    labelPath = labelPath + tempfile.mkdtemp()
    labelList = data.get("label_list")
    labelList = json.loads(labelList)
    # print("process-image:", labelList)

    label_data_paths = []

    if not os.path.exists(labelPath):
        os.makedirs(labelPath)

    # Generate label image
    img = cv2.imread(imagePath)
    height = img.shape[0]
    width = img.shape[1]
    print("image-size: ", width, " : ", height)

    labelImagePath = labelPath + "/Labels.png"
    cv2.imwrite(labelImagePath, numpy.zeros((height, width, 3), numpy.uint8))
    blank_image = cv2.imread(labelImagePath)

    for label in labelList:
        labelPositionArr = label["positions"]
        h = label["label_color"].lstrip('#')

        if len(labelPositionArr) > 0:
            for arr in labelPositionArr:
                coordinates = []
                for pos in arr:
                    coordinates.append((pos["x"], pos["y"]))

                pts = numpy.array(coordinates, numpy.int32)
                pts = pts.reshape((-1, 1, 2))
                color = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

                isClosed = False

                blank_image = cv2.polylines(blank_image, [pts],
                                            isClosed, color,
                                            thickness)

    blank_image = cv2.cvtColor(blank_image, cv2.COLOR_BGR2GRAY)
    cv2.imwrite(labelImagePath, blank_image)
    label_data_paths.append(labelImagePath)

    if not os.path.exists(projectPath):
        os.makedirs(projectPath)

    if not os.path.exists(dataImagePath):
        os.makedirs(dataImagePath)



    SAMPLE_MASK = os.path.join(projectPath, "mask.npy")
    numpy.save(SAMPLE_MASK, numpy.ones((2, 20, 20, 5, 1), dtype=numpy.uint8))

    project_file_path = os.path.join(projectPath, 'MyProject.ilp')

    newProjectFile = ProjectManager.createBlankProjectFile(project_file_path, PixelClassificationWorkflow, [])
    newProjectFile.close()


    shell = HeadlessShell()
    shell.openProjectFile(project_file_path)
    workflow = shell.workflow

    # Add a file
    from ilastik.applets.dataSelection.opDataSelection import FilesystemDatasetInfo

    info = FilesystemDatasetInfo(filePath=imagePath)
    opDataSelection = workflow.dataSelectionApplet.topLevelOperator
    opDataSelection.DatasetGroup.resize(1)
    opDataSelection.DatasetGroup[0][0].setValue(info)

    # Set some features
    ScalesList = [0.3, 0.7, 1, 1.6, 3.5, 5.0, 10.0]
    FeatureIds = [
        "GaussianSmoothing",
        "LaplacianOfGaussian",
        "StructureTensorEigenvalues",
        "HessianOfGaussianEigenvalues",
        "GaussianGradientMagnitude",
        "DifferenceOfGaussians",
    ]

    opFeatures = workflow.featureSelectionApplet.topLevelOperator
    opFeatures.Scales.setValue(ScalesList)
    opFeatures.FeatureIds.setValue(FeatureIds)

    #                    sigma:   0.3    0.7    1.0    1.6    3.5    5.0   10.0
    selections = numpy.array(
        [
            [True, False, False, False, False, False, False],
            [True, False, False, False, False, False, False],
            [True, False, False, False, False, False, False],
            [False, False, False, False, False, False, False],
            [False, False, False, False, False, False, False],
            [False, False, False, False, False, False, False],
        ]
    )
    opFeatures.SelectionMatrix.setValue(selections)

    # Add some labels directly to the operator
    opPixelClass = workflow.pcApplet.topLevelOperator

    # Read each label volume and inject the label data into the appropriate training slot
    cwd = os.getcwd()
    label_classes = set()
    for lane, label_data_path in enumerate(label_data_paths):
        graph = Graph()
        opReader = OpInputDataReader(graph=graph)
        try:
            opReader.WorkingDirectory.setValue(cwd)
            opReader.FilePath.setValue(label_data_path)

            print("Reading label volume: {}".format(label_data_path))
            label_volume = opReader.Output[:].wait()
        finally:
            opReader.cleanUp()

        raw_shape = opPixelClass.InputImages[lane].meta.shape
        if label_volume.ndim != len(raw_shape):
            # Append a singleton channel axis
            assert label_volume.ndim == len(raw_shape) - 1
            label_volume = label_volume[..., None]

        # Auto-calculate the max label value
        label_classes.update(numpy.unique(label_volume))

        print("Applying label volume to lane #{}".format(lane))
        entire_volume_slicing = roiToSlice(*roiFromShape(label_volume.shape))
        opPixelClass.LabelInputs[lane][entire_volume_slicing] = label_volume

    assert len(label_classes) > 1, "Not enough label classes were found in your label data."
    label_names = [str(label_class) for label_class in sorted(label_classes) if label_class != 0]
    opPixelClass.LabelNames.setValue(label_names)

    # Train the classifier
    opPixelClass.FreezePredictions.setValue(False)
    _ = opPixelClass.Classifier.value

    # Save and close
    shell.projectManager.saveProject()
    shell.closeCurrentProject()

    args = "--project=" + project_file_path
    args += " --headless"

    # Batch export options
    args += " --export_source=probabilities"
    args += " --output_format=tiff"
    args += " --output_filename_format={dataset_dir}/{nickname}_prediction.tiff"
    args += " --output_internal_path=volume/pred_volume"
    args += " --raw_data"
    # test that relative path works correctly: should be relative to cwd, not project file.
    args += " " + os.path.normpath(os.path.relpath(imagePath, os.getcwd()))

    print('ilastik-arg:', args)

    old_sys_argv = list(sys.argv)
    sys.argv = ["ilastik.py"]  # Clear the existing commandline args so it looks like we're starting fresh.
    sys.argv += args.split()

    # Start up the ilastik.py entry script as if we had launched it from the command line
    try:
        ilastik_startup.main()
    finally:
        sys.argv = old_sys_argv

    output_path = imagePath[:-5] + "_prediction.tiff"
    new_path = imagePath[:-5] + "_prediction.ome.tiff"

    cmd_str = "sh /app/ilastikApi/bftools/bfconvert -noflat -separate -tilex 1024 -tiley 1024 -pyramid-scale 2 -pyramid-resolutions 4 -separate -overwrite '" + output_path + "' '" + new_path + "'"
    subprocess.run(cmd_str, shell=True)

    return JSONResponse({"success": True, "image_path": new_path})


@router.get("/download")
async def download_exp_image(
    request: Request,
    path: str
):
    file_size = os.path.getsize(path)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    range = request.headers["Range"]
    if range is None:
        return FileResponse(path, filename=path)
    ranges = range.replace("bytes=", "").split("-")
    range_start = int(ranges[0]) if ranges[0] else None
    range_end = int(ranges[1]) if ranges[1] else file_size - 1
    if range_start is None:
        return Response(content="Range header required", status_code=416)
    if range_start >= file_size:
        return Response(content="Range out of bounds", status_code=416)
    if range_end >= file_size:
        range_end = file_size - 1
    content_length = range_end - range_start + 1
    headers = {
        "Content-Range": f"bytes {range_start}-{range_end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
    }
    with open(path, "rb") as file:
        file.seek(range_start)
        content = file.read(content_length)
        return Response(content, headers=headers, status_code=206)

