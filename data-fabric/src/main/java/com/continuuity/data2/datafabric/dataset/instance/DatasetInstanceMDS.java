package com.continuuity.data2.datafabric.dataset.instance;

import com.continuuity.api.common.Bytes;
import com.continuuity.data2.datafabric.dataset.AbstractObjectsStore;
import com.continuuity.internal.data.dataset.DatasetSpecification;
import com.continuuity.internal.data.dataset.lib.table.OrderedTable;

import java.util.Collection;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * Dataset instances metadata store
 */
final class DatasetInstanceMDS extends AbstractObjectsStore {
  /**
   * Prefix for rows containing instance info.
   * NOTE: even though we don't have to have it now we may want to store different type of data in one table, so
   *       the prefix may help us in future
   */
  private static final byte[] INSTANCE_PREFIX = Bytes.toBytes("i_");

  public DatasetInstanceMDS(OrderedTable table) {
    super(table);
  }

  @Nullable
  public DatasetSpecification get(String name) {
    return get(getInstanceKey(name), DatasetSpecification.class);
  }

  public void write(DatasetSpecification instanceSpec) {
    put(getInstanceKey(instanceSpec.getName()), instanceSpec);
  }

  public boolean delete(String name) {
    if (get(name) == null) {
      return false;
    }
    delete(getInstanceKey(name));
    return true;
  }

  public Collection<DatasetSpecification> getAll() {
    Map<String, DatasetSpecification> instances = scan(INSTANCE_PREFIX, DatasetSpecification.class);
    return instances.values();
  }

  public void deleteAll() {
    deleteAll(INSTANCE_PREFIX);
  }

  private byte[] getInstanceKey(String name) {
    return Bytes.add(INSTANCE_PREFIX, Bytes.toBytes(name));
  }
}
