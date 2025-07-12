import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAttractorRecordsStore } from '../attractor-records-store';
import { AttractorRecord } from '../../lib/attractor-indexdb';

// Mock the indexedDB functions
vi.mock('../../lib/attractor-indexdb', () => ({
  getPaginatedAttractors: vi.fn(),
  saveAttractor: vi.fn(),
  deleteAttractor: vi.fn(),
}));

// Import mocks after mocking
import { getPaginatedAttractors, saveAttractor, deleteAttractor } from '../../lib/attractor-indexdb';

// Sample data for tests
const sampleAttractorParameters = {
  attractor: "clifford" as const,
  a: 1.2,
  b: -2.1,
  c: 1.0,
  d: 0.7,
  hue: 180,
  saturation: 90,
  brightness: 95,
  background: [0, 0, 0, 255] as [number, number, number, number],
  scale: 1,
  left: 0,
  top: 0,
};

const sampleRecords: AttractorRecord[] = [
  {
    uuid: 'test-uuid-1',
    name: 'Test Attractor 1',
    attractorParameters: sampleAttractorParameters,
    createdAt: Date.now() - 10000,
    image: 'data:image/png;base64,testimage123',
  },
  {
    uuid: 'test-uuid-2',
    name: 'Test Attractor 2',
    attractorParameters: sampleAttractorParameters,
    createdAt: Date.now(),
    image: 'data:image/png;base64,testimage456',
  },
];

// Extract initial state to use for comparisons
const getInitialState = () => ({
  records: [],
  total: 0,
  page: null,
  loading: false,
  error: null,
});

describe('useAttractorRecordsStore', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Reset the store to initial state
    const store = useAttractorRecordsStore.getState();
    useAttractorRecordsStore.setState(getInitialState());
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const state = useAttractorRecordsStore.getState();
      expect(state.records).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.page).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchRecords', () => {
    it('should fetch records from the first page', async () => {
      // Mock the getPaginatedAttractors function
      const mockResponse = { records: sampleRecords, total: sampleRecords.length };
      (getPaginatedAttractors as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      // Call fetchRecords
      await useAttractorRecordsStore.getState().fetchRecords(0);

      // Check if the function was called with the correct arguments
      expect(getPaginatedAttractors).toHaveBeenCalledWith(0);

      // Check if the state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.records).toEqual(sampleRecords);
      expect(state.total).toBe(sampleRecords.length);
      expect(state.page).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should append records when fetching subsequent pages', async () => {
      // Set initial state with some records
      // Make sure we're working with non-undefined values
      const initialRecords = [sampleRecords[0]!];
      useAttractorRecordsStore.setState({
        ...getInitialState(),
        records: initialRecords,
        total: 2,
        page: 0,
      });

      // Mock the getPaginatedAttractors function
      const page1Records = [sampleRecords[1]!];
      const mockResponse = { records: page1Records, total: 2 };
      (getPaginatedAttractors as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      // Call fetchRecords for page 1
      await useAttractorRecordsStore.getState().fetchRecords(1);

      // Check if the function was called with the correct arguments
      expect(getPaginatedAttractors).toHaveBeenCalledWith(1);

      // Check if the state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.records).toEqual([...initialRecords, ...page1Records]);
      expect(state.total).toBe(2);
      expect(state.page).toBe(1);
    });

    it('should handle errors during fetch', async () => {
      // Mock the getPaginatedAttractors function to throw an error
      const testError = new Error('Test fetch error');
      (getPaginatedAttractors as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(testError);

      // Call fetchRecords
      await useAttractorRecordsStore.getState().fetchRecords(0);

      // Check if the state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.error).toBe(testError);
      expect(state.loading).toBe(false);
    });
  });

  describe('addRecord', () => {
    it('should add a new record', async () => {
      // Setup mock responses
      (saveAttractor as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (getPaginatedAttractors as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        records: sampleRecords,
        total: sampleRecords.length,
      });

      // New record to add
      const newRecord = {
        name: 'New Test Attractor',
        attractorParameters: sampleAttractorParameters,
        image: 'data:image/png;base64,testimage789',
      };

      // Call addRecord
      await useAttractorRecordsStore.getState().addRecord(newRecord);

      // Check if the functions were called correctly
      expect(saveAttractor).toHaveBeenCalledWith(newRecord);
      expect(getPaginatedAttractors).toHaveBeenCalledWith(0);

      // Check if the state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.records).toEqual(sampleRecords);
      expect(state.loading).toBe(false);
    });

    it('should handle errors when adding a record', async () => {
      // Setup mock to throw an error
      const testError = new Error('Test add error');
      (saveAttractor as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(testError);

      // Call addRecord
      await useAttractorRecordsStore.getState().addRecord({
        name: 'Failing Record',
        attractorParameters: sampleAttractorParameters,
        image: 'data:image/png;base64,testimagefail',
      });

      // Check if the state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.error).toBe(testError);
      expect(state.loading).toBe(false);
      // getPaginatedAttractors should not be called when saveAttractor fails
      expect(getPaginatedAttractors).not.toHaveBeenCalled();
    });
  });

  describe('removeRecord', () => {
    it('should remove a record', async () => {
      // Setup mock responses
      (deleteAttractor as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (getPaginatedAttractors as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        records: [sampleRecords[0]!], // One record removed
        total: 1,
      });

      // Call removeRecord
      await useAttractorRecordsStore.getState().removeRecord('test-uuid-2');

      // Check if the functions were called correctly
      expect(deleteAttractor).toHaveBeenCalledWith('test-uuid-2');
      expect(getPaginatedAttractors).toHaveBeenCalledWith(0);

      // Check if the state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.records).toEqual([sampleRecords[0]]);
      expect(state.total).toBe(1);
      expect(state.loading).toBe(false);
    });

    it('should handle errors when removing a record', async () => {
      // Setup mock to throw an error
      const testError = new Error('Test remove error');
      (deleteAttractor as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(testError);

      // Call removeRecord
      await useAttractorRecordsStore.getState().removeRecord('test-uuid-1');

      // Check if the state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.error).toBe(testError);
      expect(state.loading).toBe(false);
      // getPaginatedAttractors should not be called when deleteAttractor fails
      expect(getPaginatedAttractors).not.toHaveBeenCalled();
    });
  });

  describe('loadMore', () => {
    it('should load the next page of records when available', async () => {
      // Setup initial state with some records
      useAttractorRecordsStore.setState({
        ...getInitialState(),
        records: [sampleRecords[0]!],
        total: 2, // Total is more than current records length
        page: 0,
      });

      // Setup mock response for next page
      (getPaginatedAttractors as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        records: [sampleRecords[1]],
        total: 2,
      });

      // Call loadMore
      await useAttractorRecordsStore.getState().loadMore();

      // Check if fetchRecords was called with the next page
      expect(getPaginatedAttractors).toHaveBeenCalledWith(1);

      // Check if state was updated correctly
      const state = useAttractorRecordsStore.getState();
      expect(state.records).toEqual(sampleRecords);
      expect(state.page).toBe(1);
    });

    it('should not load more when all records are already loaded', async () => {
      // Setup state where all records are loaded
      useAttractorRecordsStore.setState({
        ...getInitialState(),
        records: sampleRecords,
        total: sampleRecords.length,
        page: 0,
      });

      // Call loadMore
      useAttractorRecordsStore.getState().loadMore();

      // Check that getPaginatedAttractors was not called
      expect(getPaginatedAttractors).not.toHaveBeenCalled();
    });

    it('should not load more when already loading', async () => {
      // Setup state where loading is in progress
      useAttractorRecordsStore.setState({
        ...getInitialState(),
        records: [sampleRecords[0]!],
        total: 2,
        page: 0,
        loading: true,
      });

      // Call loadMore
      useAttractorRecordsStore.getState().loadMore();

      // Check that getPaginatedAttractors was not called
      expect(getPaginatedAttractors).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should fetch records from the first page', async () => {
      // Setup mock
      (getPaginatedAttractors as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        records: sampleRecords,
        total: sampleRecords.length,
      });

      // Call refresh
      await useAttractorRecordsStore.getState().refresh();

      // Check if fetchRecords was called with page 0
      expect(getPaginatedAttractors).toHaveBeenCalledWith(0);
    });
  });
});
