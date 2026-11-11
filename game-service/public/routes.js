function reachable(graph, houses, start, steps) {
  const destinations=[];
  function walk(node,route) {
    if(route.length===steps||route.length>0&&houses.includes(node)) {
      destinations.push({node,route:[...route]});
    }
    if(route.length===steps)return;
    for(const next of graph[node]||[])walk(next,[...route,next]);
  }
  walk(start,[]);
  return destinations;
}
if(typeof module!=='undefined')module.exports={reachable};
if(typeof window!=='undefined')window.routes={reachable};
