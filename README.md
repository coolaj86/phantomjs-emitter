phantomjs-emitter
=================

An event emitter between the browser and node side of PhantomJS

Jan 1st:

I had working code a few commits ago, but only working in one direction.
For some crazy reason the function arguments become undefined and it seems to be a bug in the PhantomJS VM...

If this isn't working by Jan 5th 2014, I'll probably never get around to fixing it and should delete the repo

Jan 2nd:

Found that there's definitely a bug in phantomjs, but there's also a workaround...
going back to old commits to fix it.
