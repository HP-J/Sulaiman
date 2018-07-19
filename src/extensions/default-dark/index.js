import * as ext from 'sulaiman';

// set the default search bar placeholder
ext.setPlaceholder('Search');

// append the theme stylesheets
ext.appendStyleDir(__dirname + '/styles', ext.hideSplashScreen);

// TODO load the theme icon set
