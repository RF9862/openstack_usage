import cv2
import os
from PIL import Image

def save_all_frames(video_path, dir_path, basename, ext='jpg'):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return

    os.makedirs(dir_path, exist_ok=True)
    base_path = os.path.join(dir_path, basename)

    digit = len(str(int(cap.get(cv2.CAP_PROP_FRAME_COUNT))))

    n = 0

    while True:
        ret, frame = cap.read()
        if ret:
            cv2.imwrite('{}_{}.{}'.format(base_path, str(n).zfill(digit), ext), frame)
            filename = '{}_{}.{}'.format(base_path, str(n).zfill(digit), ext)
            output_filename = '{}_{}.{}'.format(base_path, str(n).zfill(digit), 'tiff')
            im = Image.open(filename)
            im.save(output_filename, 'TIFF')
            n += 1
        else:
            return


