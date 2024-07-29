import { PacketBuffer } from './packetBuffer.js'
import { SslSocket } from './sslSocket.js'

class ChainInfo {
  constructor(
    public readonly height: string,
    public readonly scoreHigh: string,
    public readonly scoreLow: string,
    public readonly latestFinalizedBlock: LatestFinalizedBlock
  ) {}
}

class LatestFinalizedBlock {
  constructor(
    public readonly finalizationEpoch: number,
    public readonly finalizationPoint: number,
    public readonly height: string,
    public readonly hash: string
  ) {}
}

class ChainStatistics {
  constructor(
    public readonly height: string,
    public readonly finalizedHeight: string,
    public readonly scoreHigh: string,
    public readonly scoreLow: string
  ) {}
}

class FinalizationStatistics {
  constructor(
    public readonly epoch: number,
    public readonly point: number,
    public readonly height: string,
    public readonly hash: string
  ) {}
}

export class Catapult extends SslSocket {
  /** パケットタイプ */
  private PacketType = {
    CHAIN_STATISTICS: 5,
    FINALIZATION_STATISTICS: 0x132,
  }

  /**
   * ブロック情報取得(/chain/info同等)
   */
  async getChainInfo() {
    let chainStat = await this.getChainStatistics()
    let finalStat = await this.getFinalizationStatistics()
    let latestFinalizedBlock = new LatestFinalizedBlock(
      finalStat!.epoch,
      finalStat!.point,
      finalStat!.height,
      finalStat!.hash
    )
    let chainInfo = new ChainInfo(chainStat!.height, chainStat!.scoreHigh, chainStat!.scoreLow, latestFinalizedBlock)
    return JSON.stringify(chainInfo)
  }

  /**
   * ChainStatistics取得
   * @returns 成功: ChainStatistics, 失敗: undefined
   */
  private async getChainStatistics() {
    let chainStatistics: ChainStatistics | undefined = undefined
    try {
      const socketData = await this.requestSocket(this.PacketType.CHAIN_STATISTICS)
      if (!socketData) return undefined
      const bufferView = new PacketBuffer(Buffer.from(socketData))
      const height = bufferView.readBigUInt64LE()
      const finalizedHeight = bufferView.readBigUInt64LE()
      const scoreHigh = bufferView.readBigUInt64LE()
      const scoreLow = bufferView.readBigUInt64LE()
      chainStatistics = new ChainStatistics(
        height.toString(),
        finalizedHeight.toString(),
        scoreHigh.toString(),
        scoreLow.toString()
      )
    } catch (e) {
      chainStatistics = undefined
    }
    return chainStatistics
  }

  /**
   * FinalizationStatistics取得
   * @returns 成功: FinalizationStatistics, 失敗: undefined
   */
  private async getFinalizationStatistics() {
    let finalizationStatistics: FinalizationStatistics | undefined = undefined
    try {
      const socketData = await this.requestSocket(this.PacketType.FINALIZATION_STATISTICS)
      if (!socketData) return undefined
      const bufferView = new PacketBuffer(Buffer.from(socketData))
      const epoch = bufferView.readUInt32LE()
      const point = bufferView.readUInt32LE()
      const height = bufferView.readBigUInt64LE()
      const hash = bufferView.readHexString(32).toUpperCase()
      finalizationStatistics = new FinalizationStatistics(epoch, point, height.toString(), hash)
    } catch (e) {
      finalizationStatistics = undefined
    }
    return finalizationStatistics
  }
}
