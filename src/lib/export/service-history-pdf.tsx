import path from "node:path"

import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

/** Roboto з кирилицею (public/fonts); вбудовані шрифти PDF кирилиці не мають. */
const FONT_DIR = path.join(process.cwd(), "public", "fonts")
Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(FONT_DIR, "Roboto-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Roboto-Bold.ttf"), fontWeight: 700 },
  ],
})
// Не переносимо слова зі складами (дефіси в назвах робіт виглядають дивно)
Font.registerHyphenationCallback((word) => [word])

const C = { blue: "#1766F2", ink: "#0B1220", muted: "#5B6475", border: "#E5E9F0", soft: "#F5F7FB", red: "#DC2626", amber: "#D97706", green: "#16A34A" }

const s = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 9.5, color: C.ink, padding: 36, paddingBottom: 56 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.blue },
  brand: { fontSize: 20, fontWeight: 700, color: C.blue },
  docTitle: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  generated: { fontSize: 9, color: C.muted },
  section: { marginTop: 18 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  carBox: { backgroundColor: C.soft, borderRadius: 8, padding: 12 },
  carName: { fontSize: 15, fontWeight: 700, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "33.33%", marginBottom: 6 },
  label: { fontSize: 8, color: C.muted, marginBottom: 1 },
  value: { fontSize: 10 },
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 6 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border },
  th: { flexDirection: "row", backgroundColor: C.soft },
  thText: { fontSize: 8, fontWeight: 700, color: C.muted, textTransform: "uppercase" },
  td: { paddingVertical: 6, paddingHorizontal: 6 },
  colDate: { width: "16%" },
  colMileage: { width: "14%" },
  colWork: { width: "34%" },
  colStation: { width: "21%" },
  colTotal: { width: "15%", textAlign: "right" },
  empty: { padding: 16, textAlign: "center", color: C.muted },
  summary: { flexDirection: "row", gap: 12 },
  summaryBox: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10 },
  summaryValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  planRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 8 },
  planName: { flex: 1, fontWeight: 700 },
  planDue: { color: C.muted },
  footer: { position: "absolute", left: 36, right: 36, bottom: 24, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted },
})

export type PdfLabels = {
  title: string
  generated: string
  car: string
  make: string
  model: string
  year: string
  engine: string
  plate: string
  vin: string
  mileage: string
  records: string
  date: string
  work: string
  station: string
  total: string
  noRecords: string
  summary: string
  recordsCount: string
  totalSpent: string
  upcoming: string
  noUpcoming: string
  documents: string
  docType: string
  docNumber: string
  docValidUntil: string
  /** «Page {page} of {total}» з уже підставленою мовою */
  page: (page: number, total: number) => string
}

export type PdfData = {
  labels: PdfLabels
  car: { name: string; make: string; model: string; year: string; engine: string; plate: string; vin: string; mileage: string }
  records: { id: string; date: string; mileage: string; work: string; station: string; total: string }[]
  totalSpent: string
  upcoming: { id: string; name: string; due: string; status: "overdue" | "soon" | "ok" }[]
  documents: { id: string; type: string; number: string; validUntil: string; status: "valid" | "expiring" | "expired" | "no_expiry" }[]
}

const STATUS_COLOR = { overdue: C.red, soon: C.amber, ok: C.green }
const DOC_COLOR = { expired: C.red, expiring: C.amber, valid: C.green, no_expiry: C.muted }

/** A4, поля 36pt: шапка, авто, таблиця записів (новіші зверху), підсумок, найближче ТО, «Page N of M». */
export function ServiceHistoryPdf({ labels: l, car, records, totalSpent, upcoming, documents }: PdfData) {
  const carFields = [
    [l.make, car.make],
    [l.model, car.model],
    [l.year, car.year],
    [l.engine, car.engine],
    [l.plate, car.plate],
    [l.vin, car.vin],
    [l.mileage, car.mileage],
  ] as const

  return (
    <Document title={`CarVitex — ${l.title} — ${car.name}`} author="CarVitex" creator="CarVitex" producer="CarVitex">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.brand}>CarVitex</Text>
            <Text style={s.docTitle}>{l.title}</Text>
          </View>
          <Text style={s.generated}>{l.generated}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>{l.car}</Text>
          <View style={s.carBox}>
            <Text style={s.carName}>{car.name}</Text>
            <View style={s.grid}>
              {carFields.map(([label, value]) => (
                <View key={label} style={s.cell}>
                  <Text style={s.label}>{label}</Text>
                  <Text style={s.value}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>{l.records}</Text>
          <View style={s.table}>
            <View style={s.th} fixed>
              <Text style={[s.td, s.thText, s.colDate]}>{l.date}</Text>
              <Text style={[s.td, s.thText, s.colMileage]}>{l.mileage}</Text>
              <Text style={[s.td, s.thText, s.colWork]}>{l.work}</Text>
              <Text style={[s.td, s.thText, s.colStation]}>{l.station}</Text>
              <Text style={[s.td, s.thText, s.colTotal]}>{l.total}</Text>
            </View>
            {records.length === 0 ? (
              <Text style={[s.empty, { borderTopWidth: 1, borderTopColor: C.border }]}>{l.noRecords}</Text>
            ) : (
              records.map((r) => (
                <View key={r.id} style={s.tr} wrap={false}>
                  <Text style={[s.td, s.colDate]}>{r.date}</Text>
                  <Text style={[s.td, s.colMileage]}>{r.mileage}</Text>
                  <Text style={[s.td, s.colWork]}>{r.work}</Text>
                  <Text style={[s.td, s.colStation]}>{r.station}</Text>
                  <Text style={[s.td, s.colTotal, { fontWeight: 700 }]}>{r.total}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.h2}>{l.summary}</Text>
          <View style={s.summary}>
            <View style={s.summaryBox}>
              <Text style={s.label}>{l.records}</Text>
              <Text style={s.summaryValue}>{l.recordsCount}</Text>
            </View>
            <View style={s.summaryBox}>
              <Text style={s.label}>{l.totalSpent}</Text>
              <Text style={s.summaryValue}>{totalSpent}</Text>
            </View>
          </View>
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.h2}>{l.upcoming}</Text>
          {upcoming.length === 0 ? (
            <Text style={{ color: C.muted }}>{l.noUpcoming}</Text>
          ) : (
            upcoming.map((u) => (
              <View key={u.id} style={s.planRow}>
                <View style={[s.dot, { backgroundColor: STATUS_COLOR[u.status] }]} />
                <Text style={s.planName}>{u.name}</Text>
                <Text style={s.planDue}>{u.due}</Text>
              </View>
            ))
          )}
        </View>

        {documents.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.h2}>{l.documents}</Text>
            <View style={s.table}>
              <View style={s.th}>
                <Text style={[s.td, s.thText, { width: "45%" }]}>{l.docType}</Text>
                <Text style={[s.td, s.thText, { width: "30%" }]}>{l.docNumber}</Text>
                <Text style={[s.td, s.thText, { width: "25%", textAlign: "right" }]}>{l.docValidUntil}</Text>
              </View>
              {documents.map((d) => (
                <View key={d.id} style={s.tr}>
                  <View style={[s.td, { width: "45%", flexDirection: "row", alignItems: "center" }]}>
                    <View style={[s.dot, { backgroundColor: DOC_COLOR[d.status] }]} />
                    <Text style={{ fontWeight: 700 }}>{d.type}</Text>
                  </View>
                  <Text style={[s.td, { width: "30%" }]}>{d.number}</Text>
                  <Text style={[s.td, { width: "25%", textAlign: "right" }]}>{d.validUntil}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>CarVitex · {car.name}</Text>
          <Text render={({ pageNumber, totalPages }) => l.page(pageNumber, totalPages)} />
        </View>
      </Page>
    </Document>
  )
}
