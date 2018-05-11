import { remote } from 'electron';

const currentWindow = remote.getCurrentWindow();

currentWindow.setSize(50, 50);
// currentWindow.setSkipTaskbar(true);