const Workflow = require('../src/workflow');
const fs = require('fs');
const path = require('path');

describe('Workflow class', () => {
    let workflow;

    beforeEach(() => {
        return fs.promises.readFile(path.resolve(__dirname, '../testdata/healthCheckWorkflow.json'))
            .then(data => {
                let workflowSpec = JSON.parse(data);
                console.log(workflowSpec.states);  // Print the 'states' property to verify its structure
                workflow = new Workflow(workflowSpec);
            });
    });

    it('should construct Workflow object', () => {
        expect(workflow).toBeInstanceOf(Workflow);
    });

    it('should build correct DAG', () => {
        const expectedDag = {
            'HealthRuleAlert': ['CreateServiceNowChange'],
            'CreateServiceNowChange': ['WaitForApproval'],
            'WaitForApproval': ['PerformRemediation', 'EscalateAlert'],
            'PerformRemediation': ['SendStatusEmail'],
            'EscalateAlert': ['SendStatusEmail'],
            'SendStatusEmail': []
        };
        expect(workflow.dag).toEqual(expectedDag);
    });

    it('should iterate through DAG and validate transitions', () => {
        const dag = workflow.buildDag();
        const stateNames = workflow.spec.states.map(state => state.name);

        for (let [state, transitions] of Object.entries(dag)) {
            // Check that each state in the dag is a valid state in the workflow
            expect(stateNames).toContain(state);

            // Check that each transition of a state leads to a valid state in the workflow
            transitions.forEach(transition => {
                expect(stateNames).toContain(transition);
            });
        }
    });

    test('getStartState returns the name of the first state', () => {
        const startState = workflow.getStartState();
        expect(startState).toEqual('HealthRuleAlert');
    });

    test('getNextState returns the next state for a successful action result', () => {
        const currentState = 'HealthRuleAlert';
        const actionResult = 'SUCCESS';
        const nextState = workflow.getNextState(currentState, actionResult);
        expect(nextState).toEqual('CreateServiceNowChange');
    });

    test('getNextState returns the timeout state for a timeout action result', () => {
        const currentState = 'WaitForApproval';
        const actionResult = 'TIMEOUT';
        const nextState = workflow.getNextState(currentState, actionResult);
        expect(nextState).toEqual('EscalateAlert');
    });

    test('getNextState throws an error for an unexpected action result', () => {
        const currentState = 'HealthRuleAlert';
        const actionResult = 'UNKNOWN';
        expect(() => workflow.getNextState(currentState, actionResult)).toThrow(`Unexpected action result: ${actionResult}`);
    });
});




