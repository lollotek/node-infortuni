const {
    STATE_FADING_UP, STATE_FADING_DOWN, STATE_PAUSED_AT_MAX, STATE_PAUSED_AT_MIN,
    CYCLE_ASCEND_RESET, CYCLE_DESCEND_RESET, CYCLE_INVERT
} = require('./config'); //

function constrain(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function randomInt(min, max) { // inclusive min, exclusive max
    return Math.floor(Math.random() * (max - min)) + min;
}

function updateLedAnimation(config) { //
    const currentTime = Date.now();
    switch (config.animationState) { //
        case STATE_FADING_UP: //
        case STATE_FADING_DOWN: { //
            if (currentTime - config.lastUpdateTime >= config.stepIntervalMs) { //
                config.lastUpdateTime = currentTime; //

                let randomStep = (config.randomness !== 0) ? randomInt(0, config.randomness + 1) : 0; //
                let totalStep = config.stepValue + randomStep; //

                if (config.animationState === STATE_FADING_UP) { //
                    config.currentIntensity += totalStep; //
                } else {
                    config.currentIntensity -= totalStep; //
                }
                // Ensure intensity is scaled for 0-255 if original was 0-1023
                // For now, assuming min/maxIntensity are already in the 0-255 range from config
                config.currentIntensity = constrain(config.currentIntensity, config.minIntensity, config.maxIntensity); //

                if ((config.animationState === STATE_FADING_UP && config.currentIntensity === config.maxIntensity) || //
                    (config.animationState === STATE_FADING_DOWN && config.currentIntensity === config.minIntensity)) { //

                    if ((config.maxMsDuration > 0) && (config.animationState === STATE_FADING_UP)) { //
                        config.animationState = STATE_PAUSED_AT_MAX; //
                        config.pauseStartTime = currentTime; //
                    } else if ((config.minMsDuration > 0) && (config.animationState === STATE_FADING_DOWN)) { //
                        config.animationState = STATE_PAUSED_AT_MIN; //
                        config.pauseStartTime = currentTime; //
                    } else {
                        switch (config.cycleType) { //
                            case CYCLE_ASCEND_RESET: //
                                config.currentIntensity = config.minIntensity; //
                                // No state change, stays FADING_UP or switches if needed
                                break;
                            case CYCLE_DESCEND_RESET: //
                                config.currentIntensity = config.maxIntensity; //
                                 // No state change, stays FADING_DOWN or switches if needed
                                break;
                            case CYCLE_INVERT: //
                                config.animationState = (config.animationState === STATE_FADING_UP) ? STATE_FADING_DOWN : STATE_FADING_UP; //
                                break;
                        }
                    }
                }
                if (config.gpio) {
                    // Ensure currentIntensity is an integer for pwmWrite
                    config.gpio.pwmWrite(Math.round(config.currentIntensity));
                }
            }
            break;
        }
        case STATE_PAUSED_AT_MAX: { //
            if (currentTime - config.pauseStartTime >= config.maxMsDuration) { //
                if ((config.cycleType === CYCLE_INVERT) || (config.cycleType === CYCLE_DESCEND_RESET)) { //
                    config.animationState = STATE_FADING_DOWN; //
                } else if (config.cycleType === CYCLE_ASCEND_RESET) { //
                    config.animationState = STATE_FADING_UP; //
                    config.currentIntensity = config.minIntensity; //
                    if (config.gpio) config.gpio.pwmWrite(Math.round(config.currentIntensity)); //
                }
                config.lastUpdateTime = currentTime; //
            }
            break;
        }
        case STATE_PAUSED_AT_MIN: { //
            if (currentTime - config.pauseStartTime >= config.minMsDuration) { //
                if ((config.cycleType === CYCLE_INVERT) || (config.cycleType === CYCLE_ASCEND_RESET)) { //
                    config.animationState = STATE_FADING_UP; //
                } else if (config.cycleType === CYCLE_DESCEND_RESET) { //
                    config.animationState = STATE_FADING_DOWN; //
                    config.currentIntensity = config.maxIntensity; //
                    if (config.gpio) config.gpio.pwmWrite(Math.round(config.currentIntensity)); //
                }
                config.lastUpdateTime = currentTime; //
            }
            break;
        }
    }
}

function resetLedState(config) { //
    if (config.minIntensity >= config.maxIntensity) { //
        config.currentIntensity = config.minIntensity; //
        config.animationState = STATE_PAUSED_AT_MIN; //
    } else {
        config.currentIntensity = config.minIntensity; //
        config.animationState = STATE_FADING_UP; //
    }
    config.lastUpdateTime = Date.now(); //
    config.pauseStartTime = 0; //

    if (config.gpio) {
        // Ensure currentIntensity is an integer
        config.gpio.pwmWrite(Math.round(config.currentIntensity));
    }
    console.log(`LED Pin <span class="math-inline">\{config\.pin\}\: Stato resettato\. Intensity\=</span>{config.currentIntensity}, State=${config.animationState}`); //
}

module.exports = { updateLedAnimation, resetLedState };