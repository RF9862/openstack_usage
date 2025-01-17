const DEFAULT_PARAMS = {
  currentVesselType: 'Slide',
  selectedVesselHole: { row: 0, col: 1 },
  selectedVesselZ: 0,
  selectedVesselTime: 0,
  channels: [],
  viewConfigsObj: {},
  object: 0,
  currentVesseelCount: 1,
  currentVesselSeriesIdx: 0,
  selectedHolesForVisual: [],
};

const initState = {
  ...DEFAULT_PARAMS,
};

//action redux
const vessel = (state = initState, action) => {
  switch (action.type) {
    case 'vessel_selectedVesselHole':
      state.selectedVesselHole = action.content;
      break;
    case 'vessel_selectedVesselHolesForVisual':
      state.selectedHolesForVisual = action.content;
      break;
    case 'vessel_selectedVesselZ':
      state.selectedVesselZ = action.content;
      break;
    case 'vessel_selectedVesselTime':
      state.selectedVesselTime = action.content;
      break;
    case 'vessel_setCurrentVesselType':
      state.currentVesselType = action.data;
      break;
    case 'vessel_setViewConfigsObj':
      state.viewConfigsObj = action.data;
      break;
    case 'vessel_setCurrentSeriesIdx':
      state.currentVesselSeriesIdx = action.content;
      break;
    case 'INIT_VIEW':
      state.currentVesselType = 'Single-Slide';
      state.channels = [0];
      state.selectedVesselZ = 1;
      state.selectedVesselTime = 1;
      state.object = 0;
      break;
    case 'SET_NULL_VIEW':
      state.channels = [];
      state.object = 0;
      break;
    case 'SET_VESSEL_STATUS_COUNT':
      state.currentVesseelCount = action.count;
      break;

    default:
      break;
  }
  // console.log('vessel type=====>', state);
  return { ...state };
};

export default vessel;
