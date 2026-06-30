import type {
    NormalizedImportedTransaction,
  } from './transactionNormalizer';
  
  import type {
    ImportReviewItem,
  } from '../../types/importReview';
  
  export function mapTransactionToReviewItem(
    transaction: NormalizedImportedTransaction,
  ): ImportReviewItem {
    return {
      externalId: transaction.externalId,
  
      date: transaction.date,
  
      description: transaction.description,
  
      amount: transaction.amount,
  
      type: transaction.type,
  
      suggestedCategory:
        transaction.category,
  
      selectedCategory:
        transaction.category,
  
      confidence:
        transaction.categoryConfidence,
  
      matchedKeyword:
        transaction.categoryMatchedKeyword,
  
      ignored: false,
    };
  }
  
  export function mapTransactionsToReviewItems(
    transactions: NormalizedImportedTransaction[],
  ): ImportReviewItem[] {
    return transactions.map(
      mapTransactionToReviewItem,
    );
  }
  
  export function mapReviewItemsToImportedTransactions(
    items: ImportReviewItem[],
  ): NormalizedImportedTransaction[] {
    return items
      .filter((item) => !item.ignored)
      .map((item) => ({
        date: item.date,
  
        description: item.description,
  
        amount: item.amount,
  
        type: item.type,
  
        category: item.selectedCategory,
  
        categoryConfidence:
          item.confidence,
  
        categoryMatchedKeyword:
          item.matchedKeyword,
  
        externalId: item.externalId,
      }));
  }