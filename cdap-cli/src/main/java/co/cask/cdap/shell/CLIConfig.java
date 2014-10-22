/*
 * Copyright © 2014 Cask Data, Inc.
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

package co.cask.cdap.shell;

import co.cask.cdap.client.config.ClientConfig;
import co.cask.cdap.security.authentication.client.AccessToken;
import co.cask.cdap.shell.command.VersionCommand;
import com.google.common.base.Charsets;
import com.google.common.base.Objects;
import com.google.common.base.Throwables;
import com.google.common.collect.Lists;
import com.google.common.io.CharStreams;
import com.google.common.io.InputSupplier;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.List;

/**
 * Configuration for the CDAP CLI.
 */
public class CLIConfig {

  public static final String PROP_VERIFY_SSL_CERT = "verify.ssl.cert";
  public static final String ENV_ACCESSTOKEN = "ACCESS_TOKEN";

  private final ClientConfig clientConfig;
  private final String version;

  private List<HostnameChangeListener> hostnameChangeListeners;

  /**
   * @param hostname Hostname of the CDAP server to interact with (e.g. "example.com")
   */
  public CLIConfig(String hostname) {
    this.clientConfig = new ClientConfig.Builder()
      .setHostname(Objects.firstNonNull(hostname, "localhost"))
      .setVerifySSLCert(Boolean.valueOf(System.getProperty(PROP_VERIFY_SSL_CERT, "true")))
      .build();
    this.version = tryGetVersion();
    this.hostnameChangeListeners = Lists.newArrayList();
  }

  private String tryGetVersion() {
    try {
      InputSupplier<? extends InputStream> versionFileSupplier = new InputSupplier<InputStream>() {
        @Override
        public InputStream getInput() throws IOException {
          return VersionCommand.class.getClassLoader().getResourceAsStream("VERSION");
        }
      };
      return CharStreams.toString(CharStreams.newReaderSupplier(versionFileSupplier, Charsets.UTF_8));
    } catch (IOException e) {
      throw Throwables.propagate(e);
    }
  }

  public ClientConfig getClientConfig() {
    return clientConfig;
  }

  public String getHost() {
    return clientConfig.getHostname();
  }

  public URI getURI() {
    return clientConfig.getBaseURI();
  }

  public boolean isVerifySSLCert() {
    return clientConfig.isVerifySSLCert();
  }

  public String getVersion() {
    return version;
  }

  public void setHostname(String hostname) {
    clientConfig.setHostname(hostname);
    for (HostnameChangeListener listener : hostnameChangeListeners) {
      listener.onHostnameChanged(hostname);
    }
  }

  public void setPort(int port) {
    clientConfig.setPort(port);
  }

  public void setSSLEnabled(boolean sslEnabled) {
    clientConfig.setSSLEnabled(sslEnabled);
  }

  public void setAccessToken(AccessToken accessToken) {
    clientConfig.setAccessToken(accessToken);
  }

  public void addHostnameChangeListener(HostnameChangeListener listener) {
    this.hostnameChangeListeners.add(listener);
  }

  /**
   * Listener for hostname changes.
   */
  public interface HostnameChangeListener {
    void onHostnameChanged(String newHostname);
  }
}
