( function() {
  var SfmlCompilerView;

  module.exports = SfmlCompilerView = (function() {
    function SfmlCompilerView(serializedState) {
      var message;
      this.element = document.createElement('div');
      this.element.classList.add('sfml-compiler');
      message = document.createElement('div');
      message.textContent = "The SfmlCompiler package is Alive! It's ALIVE!";
      message.classList.add('message');
      this.element.appendChild(message);
    }

    SfmlCompilerView.prototype.serialize = function() {};

    SfmlCompilerView.prototype.destroy = function() {
      return this.element.remove();
    };

    SfmlCompilerView.prototype.getElement = function() {
      return this.element;
    };

    return SfmlCompilerView;

  })();

}).call(this);
