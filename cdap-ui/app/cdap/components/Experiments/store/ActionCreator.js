/*
 * Copyright © 2017 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
*/

import experimentsStore, {ACTIONS} from 'components/Experiments/store';
import createExperimentStore, {ACTIONS as CREATEEXPERIMENTACTIONS} from 'components/Experiments/store/createExperimentStore';
import experimentDetailsStore, {ACTIONS as EXPERIMENTDETAILACTIONS} from 'components/Experiments/store/experimentDetailStore';
import {myExperimentsApi} from 'api/experiments';
import NamespaceStore, {getCurrentNamespace} from 'services/NamespaceStore';
import MyDataPrepApi from 'api/dataprep';
import {directiveRequestBodyCreator} from 'components/DataPrep/helper';
import MLAlgorithmsList from 'components/Experiments/store/MLAlgorithmsList';
import { Observable } from 'rxjs/Observable';

function setExperimentsLoading() {
  experimentsStore.dispatch({
    type: ACTIONS.SET_EXPERIMENTS_LOADING
  });
}

function getExperimentsList() {
  setExperimentsLoading();
  let {selectedNamespace: namespace} = NamespaceStore.getState();
  myExperimentsApi
    .list({namespace})
    .subscribe(experiments => {
      experiments.forEach(experiment => getModelsListInExperiment(experiment.name));
      experimentsStore.dispatch({
        type: ACTIONS.SET_EXPERIMENTS_LIST,
        payload: {
          experiments
        }
      });
    }, (err) => {
      console.log(err);
    });
}

function getModelsListInExperiment(experimentId) {
  let {selectedNamespace: namespace} = NamespaceStore.getState();
  myExperimentsApi
    .getModelsInExperiment({experimentId, namespace})
    .subscribe(models => {
      experimentsStore.dispatch({
        type: ACTIONS.SET_MODELS_IN_EXPERIMENT,
        payload: {
          experimentId,
          models
        }
      });
    });
}

function onExperimentNameChange(e) {
  let value = e.target.value;
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_EXPERIMENT_NAME,
    payload: {name: value}
  });
}

function onExperimentDescriptionChange(e) {
  let value = e.target.value;
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_EXPERIMENT_DESCRIPTION,
    payload: {description: value}
  });
}

function onExperimentOutcomeChange(e) {
  let value = e.target.value;
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_EXPERIMENT_OUTCOME,
    payload: {outcome: value}
  });
}

function setSrcPath(srcpath) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_EXPERIMENT_SRC_PATH,
    payload: {srcpath}
  });
}

function setOutcomeColumns(columns) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_OUTCOME_COLUMNS,
    payload: {columns}
  });
}

function setDirectives(directives) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_DIRECTIVES,
    payload: {directives}
  });
}

function setExperimentCreated(value) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_NEW_EXPERIMENT_CREATED,
    payload: {
      isExperimentCreated: typeof value === 'boolean' ? value : true
    }
  });
}

function setExperimentLoading(value = true) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_CREATE_EXPERIMENT_LOADING,
    payload: {loading: value}
  });
}

function onModelNameChange(e) {
  let value = e.target.value;
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_MODEL_NAME,
    payload: {name: value}
  });
}

function onModelDescriptionChange(e) {
  let value = e.target.value;
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_MODEL_DESCRIPTION,
    payload: {description: value}
  });
}

function setModelMetadataFilled(isModelMetadataFilled = true) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_MODEL_METADATA_FILLED,
    payload: { isModelMetadataFilled }
  });
  createSplitAndUpdateStatus();
}
function setSplitFinalized(isSplitFinalized = true) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_SPLIT_FINALIZED,
    payload: { isSplitFinalized }
  });
}

function setModelAlgorithm(algorithm) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_MODEL_ML_ALGORITHM,
    payload: {algorithm}
  });
}

function setWorkspace(workspaceId) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_WORKSPACE_ID,
    payload: {workspaceId}
  });
}

function updateSchema(fields) {
  let schema = {
    name: 'avroSchema',
    type: 'record',
    fields
  };
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_SCHEMA,
    payload: {schema}
  });
}

function setSplitDetails(split) {
  createExperimentStore.dispatch({
    type: CREATEEXPERIMENTACTIONS.SET_SPLIT_INFO,
    payload: {split}
  });
}

function createExperiment() {
  setExperimentLoading();
  let {model_create} = createExperimentStore.getState();
  let {workspaceId, directives} = model_create;
  let {experiments_create} = createExperimentStore.getState();
  let requestBody = directiveRequestBodyCreator(directives);
  let experiment = {
    name: experiments_create.name,
    description: experiments_create.description,
    outcome: experiments_create.outcome,
    srcpath: experiments_create.srcpath,
    workspaceId: model_create.workspaceId
  };
  MyDataPrepApi
    .getSchema({ namespace: getCurrentNamespace(), workspaceId}, requestBody)
    .mergeMap((schema) => {
      // The outcome will always be simple type. So ["null", "anything"] should give correct outcomeType at the end.
      let outcomeType = schema
        .find(field => field.name === experiment.outcome)
        .type
        .filter(t => t !== 'null')
        .pop();
      experiment.outcomeType = outcomeType;
      updateSchema(schema);
      return myExperimentsApi.createExperiment({
        namespace: getCurrentNamespace(),
        experimentId: experiment.name
      }, experiment);
    })
    .subscribe(setExperimentCreated);
}

function createSplitAndUpdateStatus() {
  let {model_create, experiments_create} = createExperimentStore.getState();
  let {directives, schema} = model_create;
  let splitInfo = {
    schema,
    directives,
    type: 'random',
    parameters: { percent: "80"},
    description: `Default Random split created for model: ${model_create.name}`
  };
  myExperimentsApi
    .createSplit({namespace: getCurrentNamespace(), experimentId: experiments_create.name}, splitInfo)
    .mergeMap(split => {
      const s = split;
      let count = 1;
      const getStatusOfSplit = (callback, errorCallback, count) => {
        const params = {
          namespace: getCurrentNamespace(),
          experimentId: experiments_create.name,
          splitId: s.id
        };
        myExperimentsApi
          .getSplitStatus(params)
          .subscribe(status => {
            if (status !== 'COMPLETE') {
              if (count < 120) {
                count += count;
                setTimeout(() => {
                  getStatusOfSplit(callback, errorCallback, count);
                }, count * 1000);
              } else {
                errorCallback();
              }
            } else {
              callback();
            }
          });
      };
      return Observable.create((observer) => {
        const successCallback = () => {
          observer.next(s);
        };
        const failureCallback = () => {
          observer.error(`Couldn't create split`);
        };
        getStatusOfSplit(successCallback, failureCallback, count);
      });
    })
    .mergeMap(({id: splitId}) => {
      return myExperimentsApi
        .getSplitDetails({
        namespace: getCurrentNamespace(),
        experimentId: experiments_create.name,
        splitId
      });
    })
    .subscribe((split) => {
      setSplitDetails(split);
    });
}

function createModel() {
  let {experiments_create, model_create} = createExperimentStore.getState();
  let {split} = model_create;
  let model = {
    name: model_create.name,
    description: model_create.description,
    algorithm: model_create.algorithm.name,
    hyperparameters: {},
    features: model_create.columns.filter(column => column !== experiments_create.outcome)
  };
  let experiment = {
    name: experiments_create.name,
    description: experiments_create.description,
    outcome: experiments_create.outcome,
    srcpath: experiments_create.srcpath,
    workspaceId: model_create.workspaceId
  };
  createModel(experiment, {...model, split})
    .subscribe(() => {
      let {selectedNamespace: namespace} = NamespaceStore.getState();
      window.location.href = `${window.location.origin}/cdap/ns/${namespace}/experiments/${experiment.name}`;
    }, (err) => {
      console.log('ERROR: ', err); // FIXME: We should surface the errors. There will be errors
      setExperimentLoading(false);
    });
}

function deleteExperiment(experimentId) {
  let {selectedNamespace: namespace} = NamespaceStore.getState();
  return myExperimentsApi
    .deleteExperiment({
      namespace,
      experimentId
    });
}

function getExperimentDetails(experimentId) {
  let {selectedNamespace: namespace} = NamespaceStore.getState();
  getModelsInExperiment(experimentId);
  getSplitsInExperiment(experimentId);
  myExperimentsApi
    .getExperiment({
      namespace,
      experimentId
    })
    .subscribe(res => {
      experimentDetailsStore.dispatch({
        type: EXPERIMENTDETAILACTIONS.SET_EXPERIMENT_DETAILS,
        payload: {
          experimentDetails: {
            ...res
          }
        }
      });
    });
}

function getModelsInExperiment(experimentId) {
  let {selectedNamespace: namespace} = NamespaceStore.getState();
  experimentDetailsStore.dispatch({
    type: EXPERIMENTDETAILACTIONS.SET_LOADING
  });
  myExperimentsApi.getModelsInExperiment({
    namespace,
    experimentId
  })
  .subscribe(models => {
    experimentDetailsStore.dispatch({
      type: EXPERIMENTDETAILACTIONS.SET_MODELS,
      payload: {
        models
      }
    });
    models.forEach(model => getModelStatus(experimentId, model.id));
  });
}

function getSplitsInExperiment(experimentId) {
  let {selectedNamespace: namespace} = NamespaceStore.getState();
  myExperimentsApi
    .getSplitsInExperiment({
      namespace,
      experimentId
    })
    .subscribe(splits => {
      experimentDetailsStore.dispatch({
        type: EXPERIMENTDETAILACTIONS.SET_SPLITS,
        payload: {
          splits
        }
      });
    });
}

function getModelStatus(experimentId, modelId) {
  myExperimentsApi
    .getModelStatus({
      namespace: getCurrentNamespace(),
      experimentId,
      modelId
    })
    .subscribe(modelStatus => {
      experimentDetailsStore.dispatch({
        type: EXPERIMENTDETAILACTIONS.SET_MODEL_STATUS,
        payload: {
          modelId,
          modelStatus
        }
      });
    });
}

function setActiveModel(activeModelId) {
  experimentDetailsStore.dispatch({
    type: EXPERIMENTDETAILACTIONS.SET_ACTIVE_MODEL,
    payload: {
      activeModelId
    }
  });
}

const getAlgorithmLabel = (algorithm) => {
  let match = MLAlgorithmsList.find(algo => algo.name === algorithm);
  if (match) {
    return match.label;
  }
  return algorithm;
};

const getExperimentForEdit = (experimentId) => {
  myExperimentsApi
    .getExperiment({
      namespace: getCurrentNamespace(),
      experimentId
    })
    .subscribe(experimentDetails => {
      createExperimentStore.dispatch({
        type: CREATEEXPERIMENTACTIONS.SET_EXPERIMENT_METADATA_FOR_EDIT,
        payload: {experimentDetails}
      });
    });
};

export {
  setExperimentsLoading,
  getExperimentsList,
  getModelsListInExperiment,
  onExperimentNameChange,
  onExperimentDescriptionChange,
  onExperimentOutcomeChange,
  setExperimentLoading,
  setOutcomeColumns,
  setDirectives,
  setWorkspace,
  setExperimentCreated,
  onModelNameChange,
  onModelDescriptionChange,
  setModelMetadataFilled,
  setModelAlgorithm,
  createExperiment,
  createSplitAndUpdateStatus,
  createModel,
  setSrcPath,
  getExperimentDetails,
  getModelsInExperiment,
  setActiveModel,
  deleteExperiment,
  getAlgorithmLabel,
  getModelStatus,
  getExperimentForEdit,
  setSplitFinalized
};

