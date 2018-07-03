import * as ext from 'sulaiman';

// TODO finish documenting and move it to a new repository

export function start()
{
  ext.appendStyleDir(__dirname + '/styles', ext.hideSplashScreen);
}