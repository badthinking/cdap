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

import React, { Component } from 'react';
import NamespaceStore from 'services/NamespaceStore';
import {MyPipelineApi} from 'api/pipeline';
import {Observable} from 'rxjs/Observable';
import T from 'i18n-react';
import orderBy from 'lodash/orderBy';
import IconSVG from 'components/IconSVG';
import {humanReadableDate} from 'services/helpers';
import StatusMapper from 'services/StatusMapper';
import NextRun from 'components/PipelineList/DeployedPipelineView/NextRun';

require('./DeployedPipelineView.scss');

const INFO_MAP = {
  'cdap-data-pipeline': {
    programType: 'workflows',
    programName: 'DataPipelineWorkflow'
  },
  'cdap-data-streams': {
    programType: 'spark',
    programName: 'DataStreamsSparkStreaming'
  }
};

const PREFIX = 'features.PipelineList';

export default class DeployedPipelineView extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.fetchApps();
  }

  state = {
    pipelineList: [],
    pipelineInfo: {}
  };

  fetchApps() {
    let namespace = NamespaceStore.getState().selectedNamespace;

    let params = {
      namespace,
      artifactName: 'cdap-data-pipeline,cdap-data-streams'
    };

    MyPipelineApi.list(params)
      .subscribe(this.fetchRuns.bind(this));
  }

  fetchRuns(pipelines) {
    let namespace = NamespaceStore.getState().selectedNamespace;

    let reqArr = [];

    pipelines.forEach((pipeline) => {
      let info = INFO_MAP[pipeline.artifact.name];

      let params = {
        namespace,
        appId: pipeline.name,
        version: pipeline.version,
        programType: info.programType,
        programName: info.programName
      };

      reqArr.push(MyPipelineApi.getRuns(params));
    });

    Observable.combineLatest(reqArr)
      .subscribe((res) => {
        pipelines.forEach((pipeline, index) => {
          pipeline.runs = res[index];
        });

        this.collapseRuns(pipelines);
      });
  }

  collapseRuns(pipelines) {
    let pipelineInfo = {};

    pipelines.forEach((pipeline) => {
      if (!pipelineInfo[pipeline.name]) {
        pipelineInfo[pipeline.name] = {
          name: pipeline.name,
          type: T.translate(`${PREFIX}.${pipeline.artifact.name}`),
          runs: []
        };
      }

      let pipelineObj = pipelineInfo[pipeline.name];

      pipelineObj.runs = pipelineObj.runs.concat(pipeline.runs);
      pipelineObj.version = pipeline.version;
    });

    let pipelineList = Object.keys(pipelineInfo);

    pipelineList.forEach((pipelineName) => {
      let runs = pipelineInfo[pipelineName].runs;
      if (!runs.length) {
        pipelineInfo[pipelineName].status = StatusMapper.lookupDisplayStatus('Deployed');
        return;
      }

      runs = orderBy(pipelineInfo[pipelineName].runs, ['start'], ['desc']);

      pipelineInfo[pipelineName].runs = runs;
      pipelineInfo[pipelineName].lastStartTime = runs[0].start;

      let running = runs.filter((run) => run.status === 'RUNNING');
      let status = running.length ? StatusMapper.lookupDisplayStatus('RUNNING') : StatusMapper.lookupDisplayStatus(runs[0].status);

      pipelineInfo[pipelineName].status = status;
      pipelineInfo[pipelineName].running = running;
    });

    console.log('check', pipelineInfo);
    this.setState({
      pipelineList,
      pipelineInfo
    });
  }

  renderTable() {
    return (
      <div className="pipeline-list-table">
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Pipeline Name</th>
              <th>Type</th>
              <th>Version</th>
              <th>Total Runs Completed</th>
              <th>Last Start Time</th>
              <th>Next Run Starts</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {
              this.state.pipelineList.map((pipelineName) => {
                let pipelineInfo = this.state.pipelineInfo[pipelineName];
                let statusClassName = StatusMapper.getStatusIndicatorClass(pipelineInfo.status);

                return (
                  <tr key={pipelineName}>
                    <td className="status">
                      <span className={`fa fa-fw ${statusClassName}`}>
                        <IconSVG name="icon-circle" />
                      </span>
                      <span className="text">
                        {pipelineInfo.status}
                      </span>
                    </td>
                    <td>{pipelineInfo.name}</td>
                    <td>{pipelineInfo.type}</td>
                    <td>{pipelineInfo.version}</td>
                    <td>{pipelineInfo.runs.length}</td>
                    <td>{humanReadableDate(pipelineInfo.lastStartTime)}</td>
                    <td>
                      <NextRun pipelineInfo={pipelineInfo} />
                    </td>
                    <td>Actions</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <div className="pipeline-deployed-view">
        <div className="deployed-header">
          <div className="filter-option">
            <span className="fa fa-fw">
              <IconSVG name="icon-check-square"></IconSVG>
            </span>
            <span className="filter-text">Running</span>
          </div>

          <div className="filter-option">
            <span className="fa fa-fw">
              <IconSVG name="icon-check-square"></IconSVG>
            </span>
            <span className="filter-text">Deployed</span>
          </div>

          <div className="filter-option">
            <span className="fa fa-fw">
              <IconSVG name="icon-check-square"></IconSVG>
            </span>
            <span className="filter-text">Successful</span>
          </div>

          <div className="filter-option">
            <span className="fa fa-fw">
              <IconSVG name="icon-check-square"></IconSVG>
            </span>
            <span className="filter-text">Failed</span>
          </div>

          <div className="filter-option">
            <span className="fa fa-fw">
              <IconSVG name="icon-check-square"></IconSVG>
            </span>
            <span className="filter-text">Stopped</span>
          </div>
        </div>

        {this.renderTable()}
      </div>
    );
  }
}
