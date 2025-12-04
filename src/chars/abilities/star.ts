const optionDefaults = {
   time: 8,
};

export function star(options = optionDefaults) {
   const { time } = Object.assign({}, optionDefaults, options);
   let starPower = false;
   return {
      id: 'star',
      require: [ 'pos', 'freeze', 'flash' ],
      add() {
         this.on('collect', (item) => {
            if (item.type !== 'star') return false;
            starPower = true;
            this.trigger('starPowerChanged', starPower);
            this.flash(time, { onDone: ()=>{
               starPower = false;
               this.trigger('starPowerChanged', starPower);
            }});
         });
      },
      get hasStarPower() {
         return starPower;
      },
   };
}
