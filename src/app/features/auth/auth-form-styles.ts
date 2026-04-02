export const AUTH_FORM_STYLES = `
  h2 {
    text-align: center;
    margin-bottom: 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    color: #f0edf1;
  }

  .full-width { width: 100%; }

  mat-form-field { margin-bottom: 16px; }

  .footer {
    text-align: center;
    margin-top: 16px;
    a {
      color: #ba9eff;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }

  .error { color: #ff6e84; text-align: center; }
  .success { color: #6df5e1; text-align: center; }
  .divider { margin: 24px 0; }
  .social-buttons { margin-bottom: 16px; }

  [mat-raised-button][color="primary"] {
    background: linear-gradient(135deg, #ba9eff, #8553f3) !important;
    color: #000 !important;
    border-radius: 0.5rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
  }
`;
