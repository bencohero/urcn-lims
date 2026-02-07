"""PDF report generator using ReportLab."""

import io
from datetime import datetime
from typing import Any, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)


class PDFGenerator:
    """PDF report generator."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name="ReportTitle",
            parent=self.styles["Heading1"],
            fontSize=18,
            spaceAfter=30,
            alignment=1,  # Center
        ))
        self.styles.add(ParagraphStyle(
            name="ReportSubtitle",
            parent=self.styles["Normal"],
            fontSize=12,
            spaceAfter=20,
            alignment=1,
        ))
        self.styles.add(ParagraphStyle(
            name="SectionHeader",
            parent=self.styles["Heading2"],
            fontSize=14,
            spaceBefore=20,
            spaceAfter=10,
        ))

    def generate_inventory_report(
        self, items: List, group_by: Optional[str] = None
    ) -> io.BytesIO:
        """Generate inventory PDF report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
        )

        elements = []

        # Title
        elements.append(Paragraph("Inventory Report", self.styles["ReportTitle"]))
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            self.styles["ReportSubtitle"]
        ))
        elements.append(Spacer(1, 20))

        # Summary
        elements.append(Paragraph("Summary", self.styles["SectionHeader"]))
        summary_data = [
            ["Total Items", str(len(items))],
            ["Documents", str(sum(1 for i in items if i.item_type == "DOCUMENT"))],
            ["Equipment", str(sum(1 for i in items if i.item_type == "EQUIPMENT"))],
            ["Consumables", str(sum(1 for i in items if i.item_type == "CONSUMABLE"))],
        ]
        summary_table = Table(summary_data, colWidths=[6*cm, 4*cm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Items table
        elements.append(Paragraph("Item Details", self.styles["SectionHeader"]))

        if items:
            table_data = [["Type", "Code", "Description", "Status", "Location"]]
            for item in items[:100]:  # Limit to 100 items
                table_data.append([
                    item.item_type,
                    item.internal_code or "-",
                    (item.description or "-")[:50],
                    item.status,
                    getattr(item.container, "name", "-") if item.container else "-",
                ])

            items_table = Table(table_data, colWidths=[2.5*cm, 3*cm, 6*cm, 2.5*cm, 3*cm])
            items_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            elements.append(items_table)
        else:
            elements.append(Paragraph("No items found.", self.styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)
        return buffer

    def generate_movements_report(self, movements: List) -> io.BytesIO:
        """Generate movements PDF report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))

        elements = []

        elements.append(Paragraph("Movements Report", self.styles["ReportTitle"]))
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            self.styles["ReportSubtitle"]
        ))
        elements.append(Spacer(1, 20))

        if movements:
            table_data = [["Date", "Type", "Item", "From", "To", "Performed By"]]
            for mov in movements[:100]:
                table_data.append([
                    mov.movement_date.strftime("%Y-%m-%d %H:%M") if mov.movement_date else "-",
                    mov.movement_type,
                    str(mov.stored_item_id)[:8] if mov.stored_item_id else "-",
                    "-",
                    "-",
                    str(mov.performed_by)[:8] if mov.performed_by else "-",
                ])

            table = Table(table_data)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph("No movements found.", self.styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)
        return buffer

    def generate_access_requests_report(self, requests: List) -> io.BytesIO:
        """Generate access requests PDF report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)

        elements = []

        elements.append(Paragraph("Access Requests Report", self.styles["ReportTitle"]))
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            self.styles["ReportSubtitle"]
        ))
        elements.append(Spacer(1, 20))

        # Summary by status
        status_counts = {}
        for req in requests:
            status_counts[req.status] = status_counts.get(req.status, 0) + 1

        elements.append(Paragraph("Summary by Status", self.styles["SectionHeader"]))
        summary_data = [[status, str(count)] for status, count in status_counts.items()]
        if summary_data:
            summary_table = Table(summary_data, colWidths=[6*cm, 3*cm])
            summary_table.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]))
            elements.append(summary_table)

        elements.append(Spacer(1, 20))

        # Requests table
        if requests:
            elements.append(Paragraph("Request Details", self.styles["SectionHeader"]))
            table_data = [["Request #", "Status", "Urgency", "Requested", "Purpose"]]
            for req in requests[:50]:
                table_data.append([
                    req.request_number or "-",
                    req.status,
                    req.urgency,
                    req.requested_at.strftime("%Y-%m-%d") if req.requested_at else "-",
                    (req.purpose or "-")[:30],
                ])

            table = Table(table_data, colWidths=[3*cm, 2.5*cm, 2*cm, 2.5*cm, 6*cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]))
            elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        return buffer

    def generate_audit_trail_report(self, entries: List) -> io.BytesIO:
        """Generate audit trail PDF report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))

        elements = []

        elements.append(Paragraph("Audit Trail Report", self.styles["ReportTitle"]))
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            self.styles["ReportSubtitle"]
        ))
        elements.append(Spacer(1, 20))

        if entries:
            table_data = [["Timestamp", "Event", "Table", "User", "Action"]]
            for entry in entries[:100]:
                table_data.append([
                    entry.timestamp.strftime("%Y-%m-%d %H:%M:%S") if entry.timestamp else "-",
                    entry.event_type,
                    entry.table_name or "-",
                    entry.username or "-",
                    entry.action or "-",
                ])

            table = Table(table_data)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph("No audit entries found.", self.styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)
        return buffer
