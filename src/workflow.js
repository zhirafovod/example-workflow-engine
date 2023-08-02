class Workflow {
    constructor(spec) {
        this.spec = spec;
        this.stateMap = {};
        this.dag = this.buildDag();
        this.startState = this.getStartState();
    }
    buildDag() {
        for (const state of this.spec.states) {
            // Initialize an empty array for this state if it doesn't exist
            if (!this.stateMap[state.name]) {
                this.stateMap[state.name] = [];
            }

            // Add normal transitions
            if (state.transition) {
                if (Array.isArray(state.transition)) {
                    for (const transition of state.transition) {
                        this.stateMap[state.name].push(transition);
                    }
                } else {
                    this.stateMap[state.name].push(state.transition);
                }
            }

            // Add timeout transitions
            if (state.onTimeout && state.onTimeout.transition) {
                this.stateMap[state.name].push(state.onTimeout.transition);
            }
        }

        return this.stateMap;
    }


    // iterate over the workflow states
    iterate(callback) {
        for (const stateName in this.stateMap) {
            if (this.stateMap.hasOwnProperty(stateName)) {
                const state = this.stateMap[stateName];
                callback(state);
            }
        }
    }

    getStartState() {
        // Assuming the start state is always the first state in the array.
        return this.spec.states[0].name;
    }

    getNextState(currentState, actionResult) {
        // Assuming the actionResult determines whether we transition to the next state
        // or handle an exception, such as a timeout.
        if (actionResult === 'SUCCESS') {
            return this.dag[currentState][0];  // assuming successful transition is always the first in the array
        } else if (actionResult === 'TIMEOUT' && this.spec.states.find(state => state.name === currentState).onTimeout) {
            return this.spec.states.find(state => state.name === currentState).onTimeout.transition;
        } else {
            // Here you can handle other cases or throw an error if the action result is unexpected.
            throw new Error(`Unexpected action result: ${actionResult}`);
        }
    }
}

module.exports = Workflow;
