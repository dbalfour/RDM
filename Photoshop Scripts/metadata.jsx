#target photoshop

var lr = new AM('layer'),
    meta = new LayerMetadata('pattern', 'scale');

if (lr.hasProperty('adjustment')) {
    var adj = lr.convertToObject(lr.getProperty(p = 'adjustment'), p)
    for (o in adj) {
        if (adj[o]._obj == 'patternLayer') {
            var scale = adj[o].scale ? adj[o].scale._value : 100;
            meta.set(activeDocument.activeLayer, 'fill', scale)
            break;
        }
    }
}

if (lr.hasProperty('layerEffects')) {
    var fx = lr.convertToObject(lr.getProperty(p = 'layerEffects').value, 'patternFill')
    if (fx) {
        var scale = fx.scale ? fx.scale._value : 100;
        meta.set(activeDocument.activeLayer, 'fx', scale)
    }
}

function LayerMetadata(customNamespace, prefix) {
    if (ExternalObject.AdobeXMPScript == undefined) ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript')

    this.set = function (layerObj, key, value) {
        try {
            xmpMeta = new XMPMeta(layerObj.xmpMetadata.rawData)
        } catch (e) { xmpMeta = new XMPMeta() }

        XMPMeta.registerNamespace(customNamespace, prefix)
        xmpMeta.setProperty(customNamespace, key, value)
        layerObj.xmpMetadata.rawData = xmpMeta.serialize()
        return ""
    }

    this.get = function (layerObj, key) {
        try {
            xmpMeta = new XMPMeta(layerObj.xmpMetadata.rawData)
            var data = xmpMeta.getProperty(customNamespace, key)
        } catch (e) { }
        return data == undefined ? "" : data.value
    }
}

function AM(target) {
    var s2t = stringIDToTypeID,
        t2s = typeIDToStringID;

    target = target ? s2t(target) : null;

    this.getProperty = function (property, id, idxMode) {
        property = s2t(property);
        (r = new ActionReference()).putProperty(s2t('property'), property);
        id != undefined ? (idxMode ? r.putIndex(target, id) : r.putIdentifier(target, id)) :
            r.putEnumerated(target, s2t('ordinal'), s2t('targetEnum'));
        return getDescValue(executeActionGet(r), property)
    }

    this.hasProperty = function (property, id, idxMode) {
        property = s2t(property);
        (r = new ActionReference()).putProperty(s2t('property'), property);
        id ? (idxMode ? r.putIndex(target, id) : r.putIdentifier(target, id))
            : r.putEnumerated(target, s2t('ordinal'), s2t('targetEnum'));
        return executeActionGet(r).hasKey(property)
    }

    this.convertToObject = function (obj, key) {
        var d = new ActionDescriptor();
        switch (obj.typename) {
            case 'ActionList': d.putList(s2t(key), obj); break;
            case 'ActionDescriptor': d = obj; break;
        }
        (desc = new ActionDescriptor()).putObject(s2t('object'), s2t('json'), d);
        eval('var o = ' + executeAction(s2t('convertJSONdescriptor'), desc).getString(s2t('json')));
        return o[key]
    }

    function getDescValue(d, p) {
        switch (d.getType(p)) {
            case DescValueType.OBJECTTYPE: return { type: t2s(d.getObjectType(p)), value: d.getObjectValue(p) };
            case DescValueType.LISTTYPE: return d.getList(p);
            case DescValueType.REFERENCETYPE: return d.getReference(p);
            case DescValueType.BOOLEANTYPE: return d.getBoolean(p);
            case DescValueType.STRINGTYPE: return d.getString(p);
            case DescValueType.INTEGERTYPE: return d.getInteger(p);
            case DescValueType.LARGEINTEGERTYPE: return d.getLargeInteger(p);
            case DescValueType.DOUBLETYPE: return d.getDouble(p);
            case DescValueType.ALIASTYPE: return d.getPath(p);
            case DescValueType.CLASSTYPE: return d.getClass(p);
            case DescValueType.UNITDOUBLE: return (d.getUnitDoubleValue(p));
            case DescValueType.ENUMERATEDTYPE: return { type: t2s(d.getEnumerationType(p)), value: t2s(d.getEnumerationValue(p)) };
            default: break;
        };
    }
}