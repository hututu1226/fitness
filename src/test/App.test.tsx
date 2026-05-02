import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

describe('App shell', () => {
  it('renders the application title and bottom navigation', () => {
    render(
      <MemoryRouter initialEntries={['/stats']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="stats" element={<div>统计内容</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('健身动作记录')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '统计' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '新增训练' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '设置' })).toBeInTheDocument()
  })
})
