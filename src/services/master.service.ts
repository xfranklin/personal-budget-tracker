import { TransactionService } from './transaction.service'

class MasterService {
  public readonly transactions: TransactionService

  constructor() {
    this.transactions = new TransactionService()
  }
}

export const services = new MasterService()
export default services
