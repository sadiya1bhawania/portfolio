export interface FewShotExample {
  question: string;
  sql: string;
}

export const fewShotExamples: FewShotExample[] = [
  {
    question: "Which artists have the most albums?",
    sql: `SELECT ar.Name, COUNT(al.AlbumId) AS AlbumCount
FROM Artist ar
JOIN Album al ON al.ArtistId = ar.ArtistId
GROUP BY ar.ArtistId
ORDER BY AlbumCount DESC
LIMIT 10;`,
  },
  {
    question: "What is the total sales revenue per country?",
    sql: `SELECT c.Country, SUM(i.Total) AS Revenue
FROM Invoice i
JOIN Customer c ON c.CustomerId = i.CustomerId
GROUP BY c.Country
ORDER BY Revenue DESC;`,
  },
  {
    question: "List the top 5 best-selling tracks by quantity sold.",
    sql: `SELECT t.Name, SUM(il.Quantity) AS UnitsSold
FROM InvoiceLine il
JOIN Track t ON t.TrackId = il.TrackId
GROUP BY t.TrackId
ORDER BY UnitsSold DESC
LIMIT 5;`,
  },
  {
    question: "Which employees support the most customers?",
    sql: `SELECT e.FirstName, e.LastName, COUNT(c.CustomerId) AS CustomerCount
FROM Employee e
JOIN Customer c ON c.SupportRepId = e.EmployeeId
GROUP BY e.EmployeeId
ORDER BY CustomerCount DESC;`,
  },
];
