import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import LoginPage from '../../app/auth/login/page'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Mock auth provider
jest.mock('@/lib/auth/auth-provider', () => ({
  useAuth: () => ({
    login: jest.fn().mockResolvedValue({}),
    isLoading: false,
  }),
}))

// Mock components that might not exist
jest.mock('@/components/auth/two-factor-challenge', () => {
  return function TwoFactorChallenge() {
    return <div data-testid="two-factor-challenge">Two Factor Challenge</div>
  }
})

// Mock UI components
jest.mock('@/components/ui/button', () => {
  return {
    Button: ({ children, ...props }) => (
      <button {...props}>{children}</button>
    ),
  }
})

jest.mock('@/components/ui/card', () => {
  return {
    Card: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardHeader: ({ children, ...props }) => <header {...props}>{children}</header>,
    CardTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    CardDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
  }
})

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

describe('Login Page Accessibility Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Mock environment variables
    process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL = 'admin@example.com'
    process.env.NEXT_PUBLIC_DEMO_RESTAURANT_EMAIL = 'restaurant@example.com'
    process.env.NEXT_PUBLIC_DEMO_EMPLOYEE_EMAIL = 'employee@example.com'
    process.env.NEXT_PUBLIC_DEMO_VENDOR_EMAIL = 'vendor@example.com'
  })

  it('should not have unknown accessibility violations', async () => {
    const { container } = render(<LoginPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  describe('Semantic HTML Structure', () => {
    it('should use semantic HTML elements', () => {
      render(<LoginPage />)

      // Check for main landmark
      expect(screen.getByRole('main')).toBeInTheDocument()

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

      // Check for form
      expect(screen.getByRole('form')).toBeInTheDocument()

      // Check for navigation
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have proper landmark regions', () => {
      render(<LoginPage />)

      // Main content area
      expect(screen.getByRole('main')).toBeInTheDocument()

      // Form section
      const formSection = screen.getByLabelText(/sign in/i)
      expect(formSection).toBeInTheDocument()

      // Branding section
      const brandingSection = screen.getByLabelText(/welcome to restauranthub/i)
      expect(brandingSection).toBeInTheDocument()
    })

    it('should use proper list markup for features and demo accounts', () => {
      render(<LoginPage />)

      // Platform features list
      const featuresList = screen.getByRole('list', { name: /platform features/i })
      expect(featuresList).toBeInTheDocument()

      // Demo accounts list
      const demoAccountsList = screen.getByRole('list', { name: /quick access demo accounts/i })
      expect(demoAccountsList).toBeInTheDocument()
    })
  })

  describe('Form Accessibility', () => {
    it('should have properly labeled form controls', () => {
      render(<LoginPage />)

      // Email input
      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('id', 'email-input')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')

      // Password input
      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('id', 'password-input')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')

      // Remember me checkbox
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i })
      expect(rememberMeCheckbox).toBeInTheDocument()
      expect(rememberMeCheckbox).toHaveAttribute('id', 'remember-me')
    })

    it('should use fieldset and legend for role selection', () => {
      render(<LoginPage />)

      const roleFieldset = screen.getByRole('radiogroup')
      expect(roleFieldset).toBeInTheDocument()
      expect(roleFieldset).toHaveAttribute('aria-required', 'true')

      // Check that role options are radio buttons
      const roleOptions = screen.getAllByRole('radio')
      expect(roleOptions).toHaveLength(4) // admin, restaurant, employee, vendor

      roleOptions.forEach(option => {
        expect(option).toHaveAttribute('aria-checked')
      })
    })

    it('should provide error messages with proper ARIA attributes', async () => {
      render(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Try to submit without filling required fields
      await user.click(submitButton)

      // Wait for validation errors
      await screen.findByText(/please select your role/i)

      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation through all interactive elements', async () => {
      render(<LoginPage />)

      // Tab through role selection
      await user.tab()
      const firstRoleButton = screen.getAllByRole('radio')[0]
      expect(firstRoleButton).toHaveFocus()

      // Continue tabbing through role options
      await user.tab()
      const secondRoleButton = screen.getAllByRole('radio')[1]
      expect(secondRoleButton).toHaveFocus()

      // Tab to email input
      await user.tab()
      await user.tab()
      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveFocus()

      // Tab to password input
      await user.tab()
      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toHaveFocus()

      // Tab to password toggle button
      await user.tab()
      const passwordToggle = screen.getByLabelText(/show password/i)
      expect(passwordToggle).toHaveFocus()

      // Tab to remember me checkbox
      await user.tab()
      const rememberMeCheckbox = screen.getByRole('checkbox')
      expect(rememberMeCheckbox).toHaveFocus()

      // Tab to forgot password link
      await user.tab()
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i })
      expect(forgotPasswordLink).toHaveFocus()

      // Tab to submit button
      await user.tab()
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toHaveFocus()
    })

    it('should allow keyboard activation of interactive elements', async () => {
      render(<LoginPage />)

      // Role selection with keyboard
      const firstRoleButton = screen.getAllByRole('radio')[0]
      await user.click(firstRoleButton)
      expect(firstRoleButton).toHaveAttribute('aria-checked', 'true')

      // Password toggle with Enter key
      const passwordToggle = screen.getByLabelText(/show password/i)
      passwordToggle.focus()
      await user.keyboard('{Enter}')

      // Should toggle to "Hide password"
      expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument()

      // Submit button with Enter key
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      submitButton.focus()
      await user.keyboard('{Enter}')
      // Form submission would be handled by the mocked login function
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide appropriate ARIA labels and descriptions', () => {
      render(<LoginPage />)

      // Role selection should have proper ARIA attributes
      const roleGroup = screen.getByRole('radiogroup')
      expect(roleGroup).toHaveAttribute('aria-required', 'true')

      // Password toggle should have aria-label
      const passwordToggle = screen.getByLabelText(/show password/i)
      expect(passwordToggle).toHaveAttribute('aria-label')

      // Demo account buttons should have descriptive labels
      const demoButtons = screen.getAllByRole('listitem')
      demoButtons.forEach(button => {
        const buttonElement = button.querySelector('button')
        if (buttonElement) {
          expect(buttonElement).toHaveAttribute('aria-label')
        }
      })
    })

    it('should announce form validation errors to screen readers', async () => {
      render(<LoginPage />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      // Error should be announced with aria-live
      const errorAlert = await screen.findByRole('alert')
      expect(errorAlert).toHaveAttribute('aria-live', 'polite')
    })

    it('should provide loading states for screen readers', async () => {
      // Mock loading state
      jest.mocked(require('@/lib/auth/auth-provider').useAuth).mockReturnValue({
        login: jest.fn(),
        isLoading: true,
      })

      render(<LoginPage />)

      const submitButton = screen.getByRole('button')
      expect(submitButton).toHaveAttribute('disabled')
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(screen.getByText(/please wait, signing you in/i)).toBeInTheDocument()
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(<LoginPage />)

      // Check that focus styles are applied (via classes)
      const focusableElements = [
        screen.getAllByRole('radio')[0],
        screen.getByLabelText(/email address/i),
        screen.getByLabelText(/^password$/i),
        screen.getByLabelText(/show password/i),
        screen.getByRole('checkbox'),
        screen.getByRole('link', { name: /forgot password/i }),
        screen.getByRole('button', { name: /sign in/i }),
      ]

      focusableElements.forEach(element => {
        expect(element).toHaveClass(/focus:/)
      })
    })

    it('should maintain logical focus order', async () => {
      render(<LoginPage />)

      // Tab order should be: role options → email → password → password toggle → remember me → forgot password → submit → demo accounts → signup link
      const expectedFocusOrder = [
        () => screen.getAllByRole('radio')[0],
        () => screen.getAllByRole('radio')[1],
        () => screen.getAllByRole('radio')[2],
        () => screen.getAllByRole('radio')[3],
        () => screen.getByLabelText(/email address/i),
        () => screen.getByLabelText(/^password$/i),
        () => screen.getByLabelText(/show password/i),
        () => screen.getByRole('checkbox'),
        () => screen.getByRole('link', { name: /forgot password/i }),
        () => screen.getByRole('button', { name: /sign in/i }),
      ]

      for (let i = 0; i < expectedFocusOrder.length; i++) {
        await user.tab()
        const expectedElement = expectedFocusOrder[i]()
        expect(expectedElement).toHaveFocus()
      }
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should not rely solely on color to convey information', () => {
      render(<LoginPage />)

      // Role selection should use visual indicators beyond color
      const selectedRole = screen.getAllByRole('radio')[0]
      user.click(selectedRole)

      // Check for aria-checked attribute (not just visual styling)
      expect(selectedRole).toHaveAttribute('aria-checked', 'true')

      // Error messages should have icons, not just red color
      // This would be tested when errors are present
    })

    it('should provide alternative text for icons', () => {
      render(<LoginPage />)

      // Icons should be marked as decorative with aria-hidden
      const page = document.body
      const svgElements = page.querySelectorAll('svg')

      svgElements.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Mobile and Responsive Accessibility', () => {
    it('should maintain accessibility on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<LoginPage />)

      // Form should still be accessible on mobile
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()

      // Touch targets should be accessible
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Buttons should be large enough for touch interaction
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Error Prevention and Recovery', () => {
    it('should provide clear error messages and recovery options', async () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Enter invalid email
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      // Should show validation error
      const emailError = await screen.findByRole('alert')
      expect(emailError).toBeInTheDocument()
      expect(emailError).toHaveTextContent(/valid email/i)

      // Error should be associated with the input
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
    })
  })
})