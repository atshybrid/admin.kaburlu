/**
 * Shared Layout Context
 * Used by both SuperAdminLayout and DeskEditorLayout
 * This ensures pages can use useLayout() regardless of which layout is rendered
 */
import { createContext, useContext } from 'react'

const LayoutContext = createContext({})

export { LayoutContext }
export const useLayout = () => useContext(LayoutContext)
