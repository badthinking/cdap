package com.continuuity.data.runtime;

import com.continuuity.common.conf.CConfiguration;
import com.continuuity.common.metrics.MetricsCollectionService;
import com.continuuity.data2.transaction.inmemory.InMemoryTransactionManager;
import com.continuuity.data2.transaction.persist.TransactionStateStorage;
import com.google.inject.Inject;
import com.google.inject.Provider;

/**
 * Google Guice Provider for {@link InMemoryTransactionManager} instances.  Each call to {@link #get()} will
 * return a new {@link InMemoryTransactionManager} instance.
 */
public class InMemoryTransactionManagerProvider implements Provider<InMemoryTransactionManager> {
  private final CConfiguration conf;
  private final Provider<TransactionStateStorage> storageProvider;
  private final MetricsCollectionService metricsCollectionService;

  @Inject
  public InMemoryTransactionManagerProvider(CConfiguration config, Provider<TransactionStateStorage> storageProvider,
                                            MetricsCollectionService metricsCollectionService) {
    this.conf = config;
    this.storageProvider = storageProvider;
    this.metricsCollectionService = metricsCollectionService;
  }

  @Override
  public InMemoryTransactionManager get() {
    return new InMemoryTransactionManager(conf, storageProvider.get(), metricsCollectionService);
  }
}
