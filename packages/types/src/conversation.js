"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualificationAction = exports.ConversationStatus = void 0;
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["GREETING"] = "GREETING";
    ConversationStatus["QUALIFYING"] = "QUALIFYING";
    ConversationStatus["EXTRACTING"] = "EXTRACTING";
    ConversationStatus["SCORED"] = "SCORED";
    ConversationStatus["CLOSED"] = "CLOSED";
    ConversationStatus["TRANSFERRED"] = "TRANSFERRED";
    ConversationStatus["ABANDONED"] = "ABANDONED";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var QualificationAction;
(function (QualificationAction) {
    QualificationAction["CONTINUE_QUALIFYING"] = "CONTINUE_QUALIFYING";
    QualificationAction["TRIGGER_EXTRACTION"] = "TRIGGER_EXTRACTION";
    QualificationAction["TRIGGER_TRANSFER"] = "TRIGGER_TRANSFER";
    QualificationAction["CLOSE_CONVERSATION"] = "CLOSE_CONVERSATION";
})(QualificationAction || (exports.QualificationAction = QualificationAction = {}));
//# sourceMappingURL=conversation.js.map