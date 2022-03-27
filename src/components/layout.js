import React from "react"
import { Link } from "gatsby"
import { defineCustomElements as deckDeckGoHighlightElement } from "@deckdeckgo/highlight-code/dist/loader";
import { usePageVisitedCount } from './counter'

deckDeckGoHighlightElement();

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  const count = usePageVisitedCount({
    name: '全站 pv',
    path: 'pv'
  }) // 记录全站访问量

  let header

  if (isRootPath) {
    header = (
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    )
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    )
  }

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
        <div>
          <a href="/rss.xml" rel="noreferrer" target="_blank">rss</a> · <a rel="noreferrer" href="https://github.com/2eha0" target="_blank">github</a>
        </div>
        <div>
          { count && <span style={{ opacity: 0.1 }}>全站访问量: { count }</span> } &nbsp;
          Zehao © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}

export default Layout
