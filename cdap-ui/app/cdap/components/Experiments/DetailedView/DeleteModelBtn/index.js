import PropTypes from 'prop-types';
import React from 'react';
import DeleteEntityBtn from 'components/DeleteEntityBtn';
import {getModelsInExperiment} from 'components/Experiments/store/ActionCreator';
import NamespaceStore from 'services/NamespaceStore';
import {myExperimentsApi} from 'api/experiments';

const deleteModel = (experimentId, modelId, callback, errCallback) => {
  let {selectedNamespace: namespace} = NamespaceStore.getState();
  myExperimentsApi
    .deleteModelInExperiment({
      namespace,
      experimentId,
      modelId
    })
    .subscribe(
      () => {
        getModelsInExperiment(experimentId);
        callback();
      },
      err => {
        let error = typeof err.response === 'string' ? err.response : JSON.stringify(err);
        errCallback(error);
      }
    );
};
const deleteConfimElement = (model) => <div>Are you sure you want to delete <b>{model.name}</b> model </div>;

export default function DeleteModelBtn({experimentId, model}) {
  return (
    <DeleteEntityBtn
      confirmFn={deleteModel.bind(null, experimentId, model.id)}
      headerTitle={"Delete Model"}
      confirmationElem={deleteConfimElement(model)}
    />
  );
}

DeleteModelBtn.propTypes = {
  experimentId: PropTypes.string,
  model: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  })
};
