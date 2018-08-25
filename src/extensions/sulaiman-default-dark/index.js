import * as sulaiman from 'sulaiman';

// set the default search bar placeholder
sulaiman.setPlaceholder('Search');

// append the theme stylesheets
sulaiman.appendStyleDir(__dirname + '/styles');

// set the icon style files;
sulaiman.addIconStyle(__dirname + '/styles' + '/card.css');

// store the icon set

sulaiman.storeIcon(__dirname + '/icons/arrow.svg', 'arrow');
sulaiman.storeIcon(__dirname + '/icons/browser.svg', 'browser');
sulaiman.storeIcon(__dirname + '/icons/clipboard.svg', 'clipboard');

sulaiman.storeIcon(__dirname + '/icons/exit.svg', 'exit');
sulaiman.storeIcon(__dirname + '/icons/files.svg', 'files');
sulaiman.storeIcon(__dirname + '/icons/image.svg', 'image');

sulaiman.storeIcon(__dirname + '/icons/internet.svg', 'internet');
sulaiman.storeIcon(__dirname + '/icons/more.svg', 'more');
sulaiman.storeIcon(__dirname + '/icons/open.svg', 'open');

// sulaiman.storeIcon(__dirname + '/icons/search.svg', 'search');
sulaiman.storeIcon(__dirname + '/icons/text.svg', 'text');

sulaiman.storeIcon(__dirname + '/icons/unknown.svg', 'unknown');
sulaiman.storeIcon(__dirname + '/icons/video.svg', 'video');
// ext.storeIcon(__dirname + '/icons/voice.svg', 'voice');
