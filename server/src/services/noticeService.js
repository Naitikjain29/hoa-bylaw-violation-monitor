
const PDFDocument = require("pdfkit");

const generateNoticePDF = (notice, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 50,
      bottom: 50,
      left: 55,
      right: 55
    }
  });

  const filename = `${notice.noticeNumber}.pdf`;

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  doc.pipe(res);

  // HEADER
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("HOMEOWNERS ASSOCIATION", {
      align: "center"
    });

  doc.moveDown(0.3);

  doc
    .fontSize(11)
    .font("Helvetica")
    .text("BYLAW VIOLATION NOTICE", {
      align: "center"
    });

  doc.moveDown();

  doc
    .moveTo(55, doc.y)
    .lineTo(540, doc.y)
    .stroke();

  doc.moveDown();

  // NOTICE INFORMATION
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text(`Notice Number: ${notice.noticeNumber}`);
  doc.text(`Issue Date: ${notice.issuedAt.toDateString()}`);
  doc.text(`Due Date: ${notice.dueDate.toDateString()}`);

  doc.moveDown();

  // HOMEOWNER DETAILS
  doc.fontSize(13).text("HOMEOWNER DETAILS");

  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica");

  doc.text(`Name: ${notice.homeownerName}`);
  doc.text(`Email: ${notice.homeownerEmail || "Not provided"}`);

  doc.moveDown();

  // PROPERTY DETAILS
  doc.fontSize(13).font("Helvetica-Bold");
  doc.text("PROPERTY DETAILS");

  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica");

  doc.text(`Property: ${notice.propertyName}`);
  doc.text(`Property Number: ${notice.propertyNumber || "N/A"}`);
  doc.text(`Address: ${notice.propertyAddress}`);

  doc.moveDown();

  // VIOLATION DETAILS
  doc.fontSize(13).font("Helvetica-Bold");
  doc.text("VIOLATION DETAILS");

  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica");

  doc.text(`Category: ${notice.categoryName || "General"}`);
  doc.text(`Severity: ${notice.severity.toUpperCase()}`);

  doc.moveDown();

  doc.font("Helvetica-Bold");
  doc.text("Subject:");

  doc.font("Helvetica");
  doc.text(notice.subject);

  doc.moveDown();

  doc.font("Helvetica-Bold");
  doc.text("Violation Description:");

  doc.font("Helvetica");
  doc.text(notice.violationDescription, {
    align: "justify"
  });

  doc.moveDown();

  // NOTICE MESSAGE
  doc.font("Helvetica-Bold");
  doc.text("OFFICIAL NOTICE:");

  doc.moveDown(0.5);

  doc.font("Helvetica");
  doc.text(notice.message, {
    align: "justify",
    lineGap: 4
  });

  doc.moveDown();

  // FOOTER
  doc.moveDown();

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Important Instructions:");

  doc.font("Helvetica").fontSize(9);

  doc.text(
    "Please review the violation details and take appropriate corrective action before the due date mentioned above. Contact the HOA administration if you believe this notice has been issued incorrectly."
  );

  doc.moveDown(2);

  doc.text("Authorized By: Homeowners Association");

  doc.moveDown(0.5);

  doc.text("HOA Administration");

  doc.moveDown();

  doc
    .fontSize(8)
    .fillColor("gray")
    .text(
      "This notice is generated electronically by the HOA Bylaw Violation Monitoring System.",
      {
        align: "center"
      }
    );

  doc.end();
};

module.exports = {
  generateNoticePDF
};
