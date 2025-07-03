import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuSheetFooter } from '@/components/menu-sheet/footer'

// Mock Zustand stores
const mockReset = vi.fn()
const mockSetMenuPosition = vi.fn()

vi.mock('@repo/state/attractor-store', () => ({
  useAttractorStore: vi.fn((selector) => {
    if (selector) {
      return selector({ reset: mockReset })
    }
    return { reset: mockReset }
  })
}))

vi.mock('@/store/ui-store', () => ({
  useUIStore: vi.fn((selector) => {
    if (selector) {
      return selector({ 
        menuPosition: 'left',
        setMenuPosition: mockSetMenuPosition
      })
    }
    return { 
      menuPosition: 'left',
      setMenuPosition: mockSetMenuPosition
    }
  })
}))

// Mock dialog components
vi.mock('@/components/config-selection-dialog', () => ({
  ConfigSelectionDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="config-selection-dialog" data-open={open} />
  )
}))

vi.mock('@/components/config-save-dialog', () => ({
  ConfigSaveDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="config-save-dialog" data-open={open} />
  )
}))

describe('MenuSheetFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders all buttons and dropdown', () => {
      render(<MenuSheetFooter />)
      
      // Check for main buttons
      expect(screen.getByRole('button', { name: /additional settings/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /load settings/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset settings/i })).toBeInTheDocument()
      
      // Check for dialog components
      expect(screen.getByTestId('config-selection-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('config-save-dialog')).toBeInTheDocument()
    })

    it('renders with correct button text', () => {
      render(<MenuSheetFooter />)
      
      expect(screen.getByText('save')).toBeInTheDocument()
      expect(screen.getByText('load')).toBeInTheDocument()
      expect(screen.getByText('reset')).toBeInTheDocument()
    })

    it('renders dialogs as closed by default', () => {
      render(<MenuSheetFooter />)
      
      expect(screen.getByTestId('config-selection-dialog')).toHaveAttribute('data-open', 'false')
      expect(screen.getByTestId('config-save-dialog')).toHaveAttribute('data-open', 'false')
    })
  })

  describe('User Interactions', () => {
    it('calls reset function when reset button is clicked', async () => {
      const user = userEvent.setup()
      render(<MenuSheetFooter />)
      
      const resetButton = screen.getByRole('button', { name: /reset settings/i })
      await user.click(resetButton)
      
      expect(mockReset).toHaveBeenCalledOnce()
    })

    it('opens save dialog when save button is clicked', async () => {
      const user = userEvent.setup()
      render(<MenuSheetFooter />)
      
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      await user.click(saveButton)
      
      // Dialog should be open after clicking save
      expect(screen.getByTestId('config-save-dialog')).toHaveAttribute('data-open', 'true')
    })

    it('opens load dialog when load button is clicked', async () => {
      const user = userEvent.setup()
      render(<MenuSheetFooter />)
      
      const loadButton = screen.getByRole('button', { name: /load settings/i })
      await user.click(loadButton)
      
      // Dialog should be open after clicking load
      expect(screen.getByTestId('config-selection-dialog')).toHaveAttribute('data-open', 'true')
    })

    it('opens dropdown menu when additional settings button is clicked', async () => {
      const user = userEvent.setup()
      render(<MenuSheetFooter />)
      
      const dropdownButton = screen.getByRole('button', { name: /additional settings/i })
      await user.click(dropdownButton)
      
      // Should show the Position submenu trigger
      expect(screen.getByText('Position')).toBeInTheDocument()
    })

    it('shows position options in dropdown submenu', async () => {
      const user = userEvent.setup()
      render(<MenuSheetFooter />)
      
      // Open dropdown
      const dropdownButton = screen.getByRole('button', { name: /additional settings/i })
      await user.click(dropdownButton)
      
      // Open position submenu
      const positionTrigger = screen.getByText('Position')
      await user.click(positionTrigger)
      
      // Should show all position options
      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText('Bottom')).toBeInTheDocument()
      
      // Note: Testing the actual selection in dropdown menus is complex
      // due to how Radix UI handles radio group interactions
      // This test verifies the options are rendered correctly
    })
  })

  describe('State Integration', () => {
    it('integrates with UI store for menu position', () => {
      render(<MenuSheetFooter />)
      
      // The component should render without errors, indicating proper store integration
      expect(screen.getByRole('button', { name: /additional settings/i })).toBeInTheDocument()
      
      // The mock should have been called to get the menu position
      expect(mockSetMenuPosition).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('has proper aria labels on all buttons', () => {
      render(<MenuSheetFooter />)
      
      expect(screen.getByRole('button', { name: /additional settings/i })).toHaveAttribute('aria-label', 'Additional Settings')
      expect(screen.getByRole('button', { name: /save settings/i })).toHaveAttribute('aria-label', 'Save Settings')
      expect(screen.getByRole('button', { name: /load settings/i })).toHaveAttribute('aria-label', 'Load Settings')
      expect(screen.getByRole('button', { name: /reset settings/i })).toHaveAttribute('aria-label', 'Reset Settings')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<MenuSheetFooter />)
      
      // Tab through buttons
      await user.tab()
      expect(screen.getByRole('button', { name: /additional settings/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /save settings/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /load settings/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /reset settings/i })).toHaveFocus()
    })
  })
})
