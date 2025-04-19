export {};

declare global {
  var icon: string;

  interface AccountInitDBAddColumn {
    name: string;
    type: string;
    allowNull: boolean;
    default: any;
  }

  interface TemplateChatData {
    groupName: string;
    chats: string[];
  }

  interface MDColumn {
    index: number;
    name: string;
    active: boolean;
  }

  interface ProductUploaderAccount {
    id: number;
    name: string;
    email: string;
    avatar: string;
  }

  interface PMType {
    activeForAll: boolean;
    types: {
      name: string;
      count: number;
      active: boolean;
    }[];
  }

  interface ProductUploaderUpload {
    id: number;
    dirPath: string;
    maxFile: number;
    afterUploaded: "delete" | "move";
  }

  interface DeleteProductAccount {
    avatar: string;
    name: string;
    email: string;
    id: number;
  }

  interface NotificationState {
    soundActive: boolean;
    toastActive: boolean;
    soundVolume: number;
    soundFilename: string;
    soundFilenames?: string[];
    customList: string[]
  }

  interface StructAuthenticator {
    id: number;
    secret: string;
    label: string;
    email: string;
    added: number;
    otp?: string;
  }

  interface Config {
    product: {
      name: string;
      buildNumber?: number;
    };
  }

  interface Update {
    id: number;
    zip_file: string;
    file_name: string;
    uploaded: number;
    product_name: string;
    build_number: number;
    build_version_str: string;
    notes: string;
    size: string; // in bytes
  }

  interface MainLeftSidebar {
    chatCount: number;
    discusCount: number;
    orderCount: number;
    dikemasCount: number;
    dikirimCount: number;
    complaintCount: number;
    saldo: number;
    allAccountCount: number;
    loggedinCount: number;
    hasSaldoCount: number;
    moderatedCount: number;
    logoutCount: number;
    newOrderPotency: number;
    dikemasPotency: number;
    dikirimPotency: number;
    complaintPotency: number;
    activeSaldo: number;
    moderatedSaldo: number;
    mainSaldo: number;
    mainCount: number;
  }

  interface StructGroup {
    name: string;
    active: boolean;
    count: number;
  }

  interface StructAccount {
    num?: number;
    groupNamesArr?: string[];
    id: number;
    name: string;
    email: string;
    password: string;
    moderated: boolean;
    added: number;
    cookies: object[];
    useAuthenticator: boolean;
    secretAutenticator: string;
    avatar: string;
    lastUpdated: number;
    chatCount: number;
    lastChatEpoch: number;
    orderEpoch: number;
    orderCount: number;
    orderPotency: number;
    balance: number;
    dikemasCount: number;
    dikemasPotency: number;
    dikemasEpoch: number;
    dikirimCount: number;
    dikirimPotency: number;
    complaintCount: number;
    complaintPotency: number;
    productCount: number;
    groupNames: string;
    warning: boolean;
    shopid: string;
    authenticated: boolean;
    pinned: number;
    pinnedAt: number | null;
    statusMessage: string | null;
    pmSort: number;
    statusSort: number;
  }

  interface OpertionalScheduleAccount {
    id: number;
    name: string;
    avatar: string;
    email: string;
    authenticated: boolean;
    groupNames: string[];
  }


  interface AccountImportErrorList {
    name: string;
    email: string;
    reason: string;
  }

  interface RefreshAccountStats {
    running: boolean;
    progress: {
      processed: number;
      total: number;
      percentage: number;
    }
  }

  interface PublicRecordOrderPayload {
    name: string;
    email: string;
    avatar: string;

    count: number;
    deadline: number;
    potency: number;
    groups: string[];
  }

  interface PublicRecordDiscusPayload {
    name: string;
    email: string;
    avatar: string;
    count: number;
    groups: string[]
  }

  interface PublicRecordProcessPayload {
    name: string;
    email: string;
    avatar: string;
    count: number;
    deadline: number;
    potency: number;
    groups: string[]
  }

  interface PublicRecordShippingPayload {
    name: string;
    email: string;
    avatar: string;
    count: number;
    potency: number;
    groups: string[]
  }

  interface PublicRecordLogouts { name: string, email: string, avatar: string, groups: string[]; }
  interface PublicRecordModerated { name: string, email: string, avatar: string, groups: string[]; }
  interface PublicRecordHasSaldo { name: string, email: string, avatar: string, saldo: number, groups: string[]; }
  interface PublicRecordComplaint { name: string, email: string, avatar: string, count: number; potency: number; groups: string[]; }
  interface PublicRecordChat { name: string; email: string, count: number; epoch: number; groups: string[]; }

  interface PublicRecordPayload {
    numbers: {
      chat: number;
      discus: number;
      order: number;
      processing: number;
      shipping: number;
      complaint: number;
      active: number;
      hasBalanced: number;
      moderated: number;
      logout: number;
      accounts: number;
    },
    orders: PublicRecordOrderPayload[],
    discuses: PublicRecordDiscusPayload[],
    processes: PublicRecordProcessPayload[],
    shippings: PublicRecordShippingPayload[],
    moderateds: PublicRecordModerated[],
    hasSaldo: PublicRecordHasSaldo[],
    complaints: PublicRecordComplaint[],
    logouts: PublicRecordLogouts[],
    chats: PublicRecordChat[],
    machineId: string;
    totalBalance: number;
  }
}
