import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ModelSelector from '../renderer/components/ModelSelector';
import type { Model } from '../renderer/types';

// Mock the window.api that the component uses
window.api = {
  fetchModels: jest.fn(),
  pullModel: jest.fn(),
  deleteModel: jest.fn(),
  showModelDetails: jest.fn(),
  // Add other methods needed to satisfy TypeScript
  generateChat: jest.fn(),
  startChatStream: jest.fn(),
  stopChatGeneration: jest.fn(),
  generateChatTitle: jest.fn(),
  onChatResponseChunk: jest.fn().mockReturnValue(jest.fn()),
  onChatResponseDone: jest.fn().mockReturnValue(jest.fn()),
  onChatResponseError: jest.fn().mockReturnValue(jest.fn()),
  getApiEndpoint: jest.fn(),
  setApiEndpoint: jest.fn(),
};

describe('ModelSelector', () => {
  const mockModels: Model[] = [
    { name: 'llama2', size: '4.0 GB', modified_at: '2023-01-01' },
    { name: 'gpt4', size: '8.0 GB', modified_at: '2023-02-01' },
  ];

  const mockProps = {
    models: mockModels,
    selectedModel: 'llama2',
    onSelectModel: jest.fn(),
    onRefreshModels: jest.fn(),
    onPullModel: jest.fn(),
    onDeleteModel: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ModelSelector component', () => {
    render(
      <ModelSelector
        models={mockProps.models}
        selectedModel={mockProps.selectedModel}
        onSelectModel={mockProps.onSelectModel}
        onRefreshModels={mockProps.onRefreshModels}
        onPullModel={mockProps.onPullModel}
        onDeleteModel={mockProps.onDeleteModel}
        loading={mockProps.loading}
      />
    );
    
    // Check if model selector is displayed
    expect(screen.getByText('Model Management')).toBeInTheDocument();
    
    // Check if the current model section is displayed
    expect(screen.getByText('Current Model')).toBeInTheDocument();
    
    // The model name appears in multiple places, so we'll check the specific one in the current model section
    const currentModelSection = screen.getByText('Current Model').parentElement;
    expect(currentModelSection).toBeInTheDocument();
    // Only run this assertion if currentModelSection exists (which it should based on previous assertion)
    expect(within(currentModelSection as HTMLElement).getByText('llama2')).toBeInTheDocument();
  });

  it('calls onRefreshModels when refresh button is clicked', () => {
    render(
      <ModelSelector
        models={mockProps.models}
        selectedModel={mockProps.selectedModel}
        onSelectModel={mockProps.onSelectModel}
        onRefreshModels={mockProps.onRefreshModels}
        onPullModel={mockProps.onPullModel}
        onDeleteModel={mockProps.onDeleteModel}
        loading={mockProps.loading}
      />
    );
    
    // Find and click the refresh button
    const refreshButton = screen.getByText('Refresh Models');
    fireEvent.click(refreshButton);
    
    // Check if the onRefreshModels callback was called
    expect(mockProps.onRefreshModels).toHaveBeenCalled();
  });
}); 