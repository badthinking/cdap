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
import moment from 'moment';

export default class Duration extends Component {
  static propTypes = {
    targetTime: PropTypes.number,
    isMillisecond: PropTypes.bool
  };

  static defaultProps = {
    isMillisecond: true
  };

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.calculateTime();
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  // Need to add steps when the component receive a new targetTime

  state = {
    displayDuration: null
  };

  calculateTime() {
    if (!this.props.targetTime) { return; }

    let targetTime = this.props.targetTime;

    if (!this.props.isMillisecond) {
      targetTime *= 1000;
    }

    let duration = targetTime - new Date().valueOf();

    let isPast = duration < 0;

    this.setState({
      displayDuration: moment.duration(duration).humanize(isPast)
    }, () => {
      let delay = 1000;

      let absDuration = Math.abs(duration);

      if (absDuration > 60000) {
        delay *= 60;
      }

      if (absDuration > 60 * 60 * 1000) {
        delay *= 60;
      }

      this.timeout = setTimeout(() => {
        this.calculateTime();
      }, delay);
    });
  }

  render() {
    if (!this.props.targetTime) {
      return (
        <span  className="duration-display">--</span>
      );
    }

    return (
      <span className="duration-display">
        {this.state.displayDuration}
      </span>
    );
  }
}

