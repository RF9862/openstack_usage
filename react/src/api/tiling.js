import mainApiService from '@/services/mainApiService';

export const uploadTiles = async (files) => {
  const formData = files.reduce((acc, file) => {
    acc.append('files', file);
    return acc;
  }, new FormData());
  return await mainApiService.post('/image/tile/upload_tiles', formData);
};

export const createTilesFromCloud = async (paths) => {
  return await mainApiService.post('/image/tile/create_tiles', {
    paths: paths,
  });
};

export const getTiles = async () => {
  return await mainApiService.get('/image/tile/get_tiles');
};

export const deleteTiles = async (tileIds) => {
  const formData = tileIds.reduce((acc, tileId) => {
    acc.append('tile_ids', tileId);
    return acc;
  }, new FormData());
  return await mainApiService.post('/image/tile/delete_tiles', formData);
};

export const updateTilesMetaInfo = async (tilesMetaInfo) => {
  const config = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    },
  };

  return await mainApiService.post('/image/tile/update_tiles_meta_info', {
    tiles_meta_info: tilesMetaInfo,
  });
};

export const buildPyramid = async (params) => {
  return await mainApiService.post('/image/tile/build_pyramid', params);
};

export const normalizeTiledImage = async (params) => {
  return await mainApiService.post('/image/tile/result_tile_normalize', params);
};

export const correctionTiledImage = async (params) => {
  return await mainApiService.post(
    '/image/tile/result_tile_correction',
    params,
  );
};

export const gammaTiledImage = async (params) => {
  return await mainApiService.post('/image/tile/result_tile_gamma', params);
};

export const bestFitTiledImage = async () => {
  return await mainApiService.post('/image/tile/result_tile_bestfit');
};

export const snapToEdge = async () => {
  return await mainApiService.post('/image/tile/result_tile_snap_to_edge');
};
