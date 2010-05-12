Summary
=======

[Dojo] [1] / [Closure] [2] adapter. Written as a proof of concept.

License
=======

The Closure Library is licensed under Apache License 2.0. The Dojo Toolkit is
licensed under AFL/BSD.

While I want my code to be AFL/BSD, I am not sure how these licenses are
compatible with Apache License 2.0, and what supersedes what. Hmm...

Use
===

Replace following line, which loads Closure:

    <script src="/closure/closure/goog/base.js"></script>

With these two lines, which load Dojo and :

    <script src="/dojo/dojo.js"
      djConfig="modulePaths: {goog: '/closure/closure/goog'}"></script>
    <script src="../dojo-closure.js"></script>

Notes:
------

1. The example above assumes that Closure is deployed in the /closure folder on a web server.

2. Instead of the second script you can just dojo.require() this module.

3. Dojo Builder would not create a build with Closure modules at this point. Don't even try.

   [1]: http://dojotoolkit.org/ "The Dojo Toolkit"
   [2]: http://code.google.com/closure/ "Closure Tools"