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
import PropTypes from 'prop-types';
import PipelineTableRow from 'components/PipelineList/DeployedPipelineView/PipelineTable/PipelineTableRow';

require('./PipelineTable.scss');

export default class PipelineTable extends Component {
  static propTypes = {
    pipelineList: PropTypes.array,
    pipelineInfo: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="pipeline-list-table">
        <div className="table-header">
          <div className="table-column toggle-expand-column"></div>
          <div className="table-column name">
            Pipeline Name
          </div>
          <div className="table-column type">
            Type
          </div>
          <div className="table-column version">
            Version
          </div>
          <div className="table-column runs">
            Total Runs
          </div>
          <div className="table-column status">
            Status
          </div>
          <div className="table-column last-start">
            Last Start Time
          </div>
          <div className="table-column next-run">
            Next Run Starts in
          </div>
          <div className="table-column tags">
            Tags
          </div>
          <div className="table-column action"></div>
        </div>

        <div className="table-body">
          {
            this.props.pipelineList.map((pipelineName) => {
              return (
                <PipelineTableRow
                  key={pipelineName}
                  pipelineInfo={this.props.pipelineInfo[pipelineName]}
                />
              );
            })
          }
        </div>
      </div>
    );
  }
}
