/**
 * @remix-run/react v1.6.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { matchRoutes } from 'react-router-dom';

// TODO: We eventually might not want to import anything directly from `history`
function matchClientRoutes(routes, location) {
  let matches = matchRoutes(routes, location);
  if (!matches) return null;
  return matches.map(match => ({
    params: match.params,
    pathname: match.pathname,
    route: match.route
  }));
}

export { matchClientRoutes };
