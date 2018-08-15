import * as api from 'sulaiman';

// set the default search bar placeholder
api.setPlaceholder('Search');

// append the theme stylesheets
api.appendStyleDir(__dirname + '/styles');

// set the icon style files;
api.addIconStyle(__dirname + '/styles' + '/card.css');

// store the icon set

api.storeIcon(__dirname + '/icons/arrow.svg', 'arrow');
api.storeIcon(__dirname + '/icons/browser.svg', 'browser');
api.storeIcon(__dirname + '/icons/clipboard.svg', 'clipboard');

api.storeIcon(__dirname + '/icons/exit.svg', 'exit');
api.storeIcon(__dirname + '/icons/files.svg', 'files');
api.storeIcon(__dirname + '/icons/image.svg', 'image');

api.storeIcon(__dirname + '/icons/internet.svg', 'internet');
api.storeIcon(__dirname + '/icons/more.svg', 'more');
api.storeIcon(__dirname + '/icons/open.svg', 'open');

// ext.storeIcon(__dirname + '/icons/phi.svg', 'phi');
api.storeIcon(__dirname + '/icons/search.svg', 'search');
api.storeIcon(__dirname + '/icons/text.svg', 'text');

api.storeIcon(__dirname + '/icons/unknown.svg', 'unknown');
api.storeIcon(__dirname + '/icons/video.svg', 'video');
// ext.storeIcon(__dirname + '/icons/voice.svg', 'voice');
