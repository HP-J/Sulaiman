import { join } from 'path';

import * as sulaiman from 'sulaiman';

// set the default search bar placeholder
sulaiman.setPlaceholder('Search');

// append the theme stylesheets
sulaiman.appendStyleDir(join(__dirname, 'styles'));

// set the icon style files;
sulaiman.addIconStyle(join(__dirname, '/styles/card.css'));

// store the default icon set
sulaiman.storeIcon(join(__dirname, '/icons/arrow.svg'), 'arrow');
sulaiman.storeIcon(join(__dirname, '/icons/browser.svg'), 'browser');
sulaiman.storeIcon(join(__dirname, '/icons/clipboard.svg'), 'clipboard');

sulaiman.storeIcon(join(__dirname, '/icons/files.svg'), 'files');
sulaiman.storeIcon(join(__dirname, '/icons/image.svg'), 'image');
sulaiman.storeIcon(join(__dirname, '/icons/internet.svg'), 'internet');

sulaiman.storeIcon(join(__dirname, '/icons/more.svg'), 'more');
sulaiman.storeIcon(join(__dirname, '/icons/open.svg'), 'open');
sulaiman.storeIcon(join(__dirname, '/icons/quit.svg'), 'quit');

sulaiman.storeIcon(join(__dirname, '/icons/text.svg'), 'text');
sulaiman.storeIcon(join(__dirname, '/icons/unknown.svg'), 'unknown');
sulaiman.storeIcon(join(__dirname, '/icons/video.svg'), 'video');
