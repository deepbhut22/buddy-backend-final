import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export const exportRedemptionsToExcel = async (redemptions, filename = 'redemptions.xlsx') => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Redemptions');

        // Define columns
        worksheet.columns = [
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Buddy ID', key: 'buddyId', width: 15 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'User Email', key: 'userEmail', width: 30 },
            { header: 'Company', key: 'company', width: 20 },
            { header: 'Product', key: 'productName', width: 20 },
            { header: 'Discount %', key: 'discountPercentage', width: 15 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Redeemed At', key: 'redeemedAt', width: 20 },
            { header: 'Expiry Date', key: 'expiryDate', width: 20 },
            { header: 'Status', key: 'status', width: 10 },
            { header: 'User Category', key: 'userCategory', width: 15 },
            { header: 'User Service', key: 'userService', width: 15 },
            { header: 'Redemption Location', key: 'redemptionLocation', width: 20 },
            { header: 'Redemption Value', key: 'redemptionValue', width: 15 }
        ];

        // Add rows
        redemptions.forEach(redemption => {
            worksheet.addRow({
                type: redemption.type,
                buddyId: redemption.buddyId,
                userName: redemption.userName,
                userEmail: redemption.userEmail,
                company: redemption.company,
                productName: redemption.productName,
                discountPercentage: redemption.discountPercentage,
                category: redemption.category.join(', '),
                redeemedAt: redemption.redeemedAt.toLocaleString(),
                expiryDate: redemption.expiryDate.toLocaleString(),
                status: redemption.status,
                userCategory: redemption.userCategory,
                userService: redemption.userService,
                redemptionLocation: redemption.redemptionLocation,
                redemptionValue: redemption.redemptionValue
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Create exports directory if it doesn't exist
        const exportDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Save the file
        const filePath = path.join(exportDir, filename);
        await workbook.xlsx.writeFile(filePath);

        return filePath;
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
}; 