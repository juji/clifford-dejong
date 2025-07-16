import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAttractorRecordsStore } from "@/store/attractor-records-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import type { AttractorParameters } from "@repo/core/types";
import {
  saveAttractor,
  getPaginatedAttractors,
  AttractorRecord,
} from "@/lib/attractor-indexdb";

// Mock IndexedDB
import "fake-indexeddb/auto";
import { indexedDB } from "fake-indexeddb";

describe("Save and Load Configuration End-to-End", () => {
  // Setup unique test data
  const testConfigName = `Test Config ${Date.now()}`;
  const testAttractorParams: AttractorParameters = {
    attractor: "clifford",
    a: 1.5,
    b: -1.8,
    c: 1.6,
    d: 0.9,
    hue: 180,
    saturation: 80,
    brightness: 90,
    background: [0, 0, 0, 255],
    scale: 1,
    left: 0,
    top: 0,
  };

  // Reset indexedDB and stores before each test
  beforeEach(() => {
    // Reset IndexedDB
    const dbName = "attractor-db";

    // Delete the database to start fresh - don't wait for completion
    indexedDB.deleteDatabase(dbName);

    // Reset the store states
    const recordsStore = useAttractorRecordsStore.getState();
    recordsStore.records = [];
    recordsStore.total = 0;
    recordsStore.page = null;

    // Set attractor store with test parameters
    const attractorStore = useAttractorStore.getState();
    attractorStore.setAttractorParams(testAttractorParams);
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  // This test focuses on the core data saving and loading functionality
  // without depending on the UI components
  it("should be able to save and retrieve configurations from IndexedDB", async () => {
    // Save an attractor configuration directly to IndexedDB
    const savedRecord = await saveAttractor({
      name: testConfigName,
      attractorParameters: testAttractorParams,
      image: "data:image/png;base64,testimageintegration",
    });

    expect(savedRecord).toBeTruthy();
    expect(savedRecord.name).toBe(testConfigName);

    // Retrieve the saved configuration using the pagination function
    const result = await getPaginatedAttractors(0, 10);

    // Verify the saved record exists and has correct data
    expect(result.total).toBeGreaterThan(0);
    expect(result.records.length).toBeGreaterThan(0);

    const retrievedRecord = result.records.find(
      (r) => r.uuid === savedRecord.uuid,
    );
    expect(retrievedRecord).toBeTruthy();
    if (retrievedRecord) {
      expect(retrievedRecord.name).toBe(testConfigName);
      expect(retrievedRecord.attractorParameters.a).toBe(testAttractorParams.a);
      expect(retrievedRecord.attractorParameters.attractor).toBe(
        testAttractorParams.attractor,
      );
      expect(retrievedRecord.attractorParameters.brightness).toBe(
        testAttractorParams.brightness,
      );
    }
  });

  it("should properly update the attractor store with saved parameters", async () => {
    // Save configuration to IndexedDB
    const savedRecord = await saveAttractor({
      name: testConfigName,
      attractorParameters: testAttractorParams,
      image: "data:image/png;base64,testimagestore",
    });

    expect(savedRecord).toBeTruthy();

    // Change the store parameters to something else
    const differentParams: AttractorParameters = {
      ...testAttractorParams,
      a: 999,
      hue: 240,
    };
    useAttractorStore.getState().setAttractorParams(differentParams);

    // Verify the store has the new parameters
    let currentParams = useAttractorStore.getState().attractorParameters;
    expect(currentParams.a).toBe(differentParams.a);

    // Now simulate loading the configuration from the database
    // This is what the loading mechanism does
    useAttractorStore
      .getState()
      .setAttractorParams(savedRecord.attractorParameters);

    // Verify the store has been updated with the loaded parameters
    currentParams = useAttractorStore.getState().attractorParameters;
    expect(currentParams.a).toBe(testAttractorParams.a);
    expect(currentParams.hue).toBe(testAttractorParams.hue);
  });

  it("should directly add a record to the records store", async () => {
    // Start with a fresh state
    const recordsStore = useAttractorRecordsStore.getState();
    recordsStore.records = [];

    // Get current record count (should be 0 after reset)
    const initialRecordCount = recordsStore.records.length;
    expect(initialRecordCount).toBe(0);

    // Create a test record object directly with the correct types
    const newRecord: AttractorRecord = {
      uuid: `test-uuid-${Date.now()}`,
      name: testConfigName,
      attractorParameters: testAttractorParams,
      createdAt: Date.now(),
      image: "data:image/png;base64,testimagetest",
    };

    // Add the record directly to the store's records array
    recordsStore.records = [...recordsStore.records, newRecord];

    // Verify the record was added
    expect(recordsStore.records.length).toBe(1);

    // Using non-null assertion since we just verified the array has a record
    const addedRecord = recordsStore.records[0];
    expect(addedRecord).toBeDefined();
    expect(addedRecord?.uuid).toBe(newRecord.uuid);
    expect(addedRecord?.name).toBe(testConfigName);
    expect(addedRecord?.attractorParameters.a).toBe(testAttractorParams.a);
  });
});
