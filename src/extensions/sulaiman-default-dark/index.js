import { join } from 'path';

import * as sulaiman from 'sulaiman';

// set the default search bar placeholder
sulaiman.setPlaceholder('Search');

// append the theme stylesheets
sulaiman.appendStyleDir(join(__dirname, 'styles'));

// store the default icon set
sulaiman.storeIcon(join(__dirname, '/icons/arrow.svg'), 'arrow');
sulaiman.storeIcon(join(__dirname, '/icons/more.svg'), 'more');
sulaiman.storeIcon(join(__dirname, '/icons/unknown.svg'), 'question');

sulaiman.storeIcon(join(__dirname, '/icons/settings.svg'), 'settings');
sulaiman.storeIcon(join(__dirname, '/icons/share.svg'), 'share');
