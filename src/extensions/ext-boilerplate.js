import { register } from '.';

register('ext-boilerplate', [], () =>
{
  require('fs');
  console.log('register completed');
});