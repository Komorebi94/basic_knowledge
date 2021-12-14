Function.prototype._bind = function(context = window, ...args) {
    const fn = this;
    args = args || [];
    const bound = function(...innerArgs) {
        const _ctx = this instanceof fn ? this : context;
        return fn.apply(_ctx, args.concat(innerArgs))
    }
    function Temp() {};
    Temp.prototype = fn.prototype;
    bound.prototype = new Temp();
    return bound;
}

const testObj = {
    x: 42,
    getX: function() {
      return this.x;
    }
  };
  
  const unboundGetX = testObj.getX;
  console.log(unboundGetX()); // The function gets invoked at the global scope
  // expected output: undefined
  
  const boundGetX = unboundGetX._bind(testObj);
  console.log(boundGetX());
  // expected output: 42