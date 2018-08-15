import * as ext from 'sulaiman';

// set the default search bar placeholder
ext.setPlaceholder('Search');

// append the theme stylesheets
ext.appendStyleDir(__dirname + '/styles');

// set the icon style files;
ext.addIconStyle(__dirname + '/styles' + '/card.css');

// store the icon set

ext.storeIcon(__dirname + '/icons/arrow.svg', 'arrow');
ext.storeIcon(__dirname + '/icons/browser.svg', 'browser');
ext.storeIcon(__dirname + '/icons/clipboard.svg', 'clipboard');

ext.storeIcon(__dirname + '/icons/exit.svg', 'exit');
ext.storeIcon(__dirname + '/icons/files.svg', 'files');
ext.storeIcon(__dirname + '/icons/image.svg', 'image');

ext.storeIcon(__dirname + '/icons/internet.svg', 'internet');
ext.storeIcon(__dirname + '/icons/more.svg', 'more');
ext.storeIcon(__dirname + '/icons/open.svg', 'open');

// ext.storeIcon(__dirname + '/icons/phi.svg', 'phi');
ext.storeIcon(__dirname + '/icons/search.svg', 'search');
ext.storeIcon(__dirname + '/icons/text.svg', 'text');

ext.storeIcon(__dirname + '/icons/unknown.svg', 'unknown');
ext.storeIcon(__dirname + '/icons/video.svg', 'video');
// ext.storeIcon(__dirname + '/icons/voice.svg', 'voice');
