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

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import NamespaceStore from 'services/NamespaceStore';
import {MyPipelineApi} from 'api/pipeline';
import IconSVG from 'components/IconSVG';
import {humanReadableDate} from 'services/helpers';

export default class NextRun extends Component {
  static propTypes = {
    pipelineInfo: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    if (this.props.pipelineInfo.type === 'Realtime') { return; }

    let namespace = NamespaceStore.getState().selectedNamespace;
    let pipelineInfo = this.props.pipelineInfo;

    // nextruntime endpoint is not under app version yet
    let params = {
      namespace,
      appId: pipelineInfo.name,
      programType: 'workflows',
      // version: pipelineInfo.version,
      programName: 'DataPipelineWorkflow'
    };

    this.interval = setInterval(() => {
      MyPipelineApi.getNextRun(params)
        .subscribe((res) => {
          this.setState({
            loading: false,
            nextRun: res.length ? res[0].time : null
          });
        });
    }, 1000*60*5);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  state = {
    loading: true,
    nextRun: null
  };

  render() {
    if (this.props.pipelineInfo.type === 'Realtime') {
      return <span>--</span>;
    }

    if (this.state.loading) {
      return (
        <span className="fa fa-spin">
          <IconSVG name="icon-spinner" />
        </span>
      );
    }

    return (
      <span>
        {humanReadableDate(this.state.nextRun, true)}
      </span>
    );
  }
}
