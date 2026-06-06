import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './page'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// signInWithPassword is the only auth method called in the login flow.
const mockSignIn = jest.fn()
// single() is the final call in the user_profiles chain.
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  }),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(<LoginPage />)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
})

describe('LoginPage', () => {
  describe('rendering', () => {
    it('renders email field, password field, and submit button', () => {
      renderLogin()

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      // label is "Password *" — regex match is sufficient
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument()
    })
  })

  describe('empty form submission', () => {
    it('shows error message when the form is submitted with no credentials', async () => {
      // Mock returns failure — mirrors what Supabase returns for empty/bad creds
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const { container } = renderLogin()

      // Use fireEvent.submit to bypass the browser's HTML5 required-field
      // validation, which jsdom does not enforce identically to real browsers.
      // This lets us test our own error-handling path.
      fireEvent.submit(container.querySelector('form')!)

      await waitFor(() => {
        expect(
          screen.getByText('Invalid email or password')
        ).toBeInTheDocument()
      })
    })
  })

  describe('failed login with filled credentials', () => {
    it('shows "Invalid email or password" when Supabase returns an auth error', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await screen.findByText('Invalid email or password')

      // Supabase was called with the values the user typed
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    })
  })
})
