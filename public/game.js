if (typeof exports !== 'undefined') {
    this["Game"] = module.exports;
}
this["Game"] = {
    /*===================================================
    PLAYER INFORMATION
    We gather this as we go along. All players must
    at least have a session.
    ===================================================*/
    session: null, // stored in redis on the server
    socket: null,
    /*===================================================
    ENERGY
    The player accumulates energy, slowly over time.
    ===================================================*/
    energy: 0, // starting energy
    energy_grow_rate: 0.1, // energy per second
    energy_grow_id: null, // keep track of the setInterval function

    /*===================================================
    ENERGY BONUSES
    You get energy for inviting friends, and for clicking
    a button that says "I love this game"
    ===================================================*/
    bonus: {
        invite: 2000,
        friend_accepts: 5000,
        like: 500,
        purchase: 100000
    },

    // Add energy according to the bonus type
    add_bonus: function(bonus_type) {
        if (this.bonus[bonus_type]) {
            this.add_energy(this.bonus[bonus_type]);
        }
    },

    // Update the energy, and sync
    add_energy: function(amount) {
        this.energy += amount;
        this.sync();
    },

    // Grow energy over time
    start_energy_growth: function() {
        var that = this;
        this.energy_grow_id = setInterval(function(){that.add_energy(1);}, 1000 / that.energy_grow_rate);
        return this.energy_grow_id;
    },

    // Stop the energy from growing over time
    stop_energy_growth: function() {
        if (this.energy_grow_id) {
            clearInterval(this.energy_grow_id);
        }
        this.energy_grow_id = 0;
    },

    // Change the energy grow rate to the input rate.
    set_energy_grow_rate: function(rate) {
        this.energy_grow_rate = rate;
        this.stop_energy_growth();
        this.start_energy_growth();
    },

    // Add the input rate to the energy grow rate.
    // This is more useful for things that give energy grow rate bonuses.
    add_energy_grow_rate: function(rate) {
        rate += this.energy_grow_rate;
        this.set_energy_grow_rate(rate);
    },

    // Replace this sync function
    sync: function() {
        return false;
    },

    update_dom: function() {
        return false;
    },

    extend: function() {
        var game = Object.create(this);
        game.bonus = Object.create(this.bonus);
        return game;
    }
}